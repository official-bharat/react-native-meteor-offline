import Meteor from '@ajaybhatia/react-native-meteor';
import { createStore, applyMiddleware } from 'redux';
import {createLogger} from 'redux-logger';
//import { REHYDRATE } from 'redux-persist/lib/constants'
import _ from 'lodash';
import { persistStore, persistReducer, REHYDRATE } from 'redux-persist';
import  AsyncStorage  from '@react-native-community/async-storage';
//import storage from 'redux-persist/lib/storage' // defaults to localStorage for web

// Actions
const ADDED = 'ddp/added';
const CHANGED  = 'ddp/changed';
const REMOVED = 'ddp/removed';

// Reducer
const reducer = (state = {}, action) => {
  const { collection, id, fields } = action.payload || {};

  switch (action.type) {
    case ADDED:
      if (!state[collection]) {
        state[collection] = {}; 
        return {
          ...state,
          [collection]: {
            [id]: fields,
          },
        };
      } else if (!state[collection][id]) {
        return { 
          ...state,
          [collection]: {
            ...state[collection],
            [id]: fields,
          },
        }
      } else {
        return {
          ...state,
          [collection]: {
            ...state[collection],
            [id]: { ...fields, ...state[collection][id] },
          }
        };
      }
    case CHANGED:
      return {
        ...state,
        [collection]: {
          ...state[collection],
          [id]: _.merge(state[collection][id], fields),
        },
      };
    case REMOVED:
      if (state[collection] && state[collection][id]) {
        return {
          ...state,
          [collection]: _.omit(state[collection], id),
        };
      }
    case REHYDRATE:
      return action.payload;
    default:
      return state;
  }
};

const onRehydration = (store) => {

  console.log('---------- STORE ---------', store.getState())

  const data = Meteor.getData();
  const db = data && data.db;
  if (db) {
   
    _.each(store.getState(), (collectionData, collectionName) => {

      console.log('COLLECTIONS: ', collectionName)

      if (!db[collectionName]){
        db.addCollection(collectionName);
      }

      const collectionArr = _.map(collectionData, (doc, _id) => {
        console.log('DATA: ', doc)
        doc._id = _id;
        return doc;
      });
 
      db[collectionName].upsert(collectionArr, function() {console.log('UPSERTING')});

      console.log('COLLECTIONS: ', collectionArr)
      //var collection = db.GetCollection(collectionName);
      //collection.update(collectionArr, { upsert: true } )
    });
  }
};

export const initializeMeteorOffline = (opts = {}) => {
  const persistConfig = {
    storage: AsyncStorage,
    key: 'react-native-meteor-offline:',
    debounce: opts.debounce || 1000,
  }

  const logger = createLogger({ predicate: () => opts.log || false }); 
  //const store = createStore(reducer, applyMiddleware(logger));
  const persistedReducer = persistReducer(persistConfig, reducer)

  const store = createStore(persistedReducer, applyMiddleware(logger));

  /*persistStore(store, { 
    storage: AsyncStorage,
    key: 'react-native-meteor-offline:',
    debounce: opts.debounce || 1000,
  }, () => console.log('*************************************             onRehydration: ', payload), onRehydration(store));*/

  let persistor = persistStore(store, null,  () => onRehydration(store))

  Meteor.ddp.on('added', (payload) => {
    //console.log('added: ', payload)
    store.dispatch({ type: ADDED, payload }); 
  });

  Meteor.ddp.on('changed', (payload) => {
    //console.log('changed: ', payload)
    store.dispatch({ type: CHANGED, payload }); 
  });

  Meteor.ddp.on('removed', (payload) => {
    //console.log('removed: ', payload)
    store.dispatch({ type: REMOVED, payload });
  });
};
