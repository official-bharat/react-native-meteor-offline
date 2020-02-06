import React, { useState, useEffect } from 'react'
import { StyleSheet, ScrollView, View, Text, Linking, SafeAreaView, } from 'react-native';
import Meteor, { withTracker, useTracker } from '@ajaybhatia/react-native-meteor';
import { List, ListItem, Icon } from 'react-native-elements'
import { initializeMeteorOffline } from './react-native-meteor-offline';
import { TouchableOpacity } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';

Meteor.connect('ws://localhost:3000/websocket');
//initializeMeteorOffline({ log: true });

const RNDemo = (props) => {
  const [linksGenerated, setlinksGenerated] = useState([])
  const [disconnected, setdisconnected] = useState(false)
  const [disconnectedData, setdisconnectedData] = useState([])
  const data = [
    {
      title: 'Meteor',
      url: 'https://www.meteor.com',
    },
    {
      title: 'Learn React Native + Meteor',
      url: 'http://learn.handlebarlabs.com/p/react-native-meteor',
    },
    {
      title: 'React Native',
      url: 'http://facebook.github.io/react-native/',
    }
  ];

  useEffect(() => {
    debugger
    console.log(props)
    if (props.links !== undefined && props.links.length > 0) {
      AsyncStorage.setItem('links', JSON.stringify(props.links))
        , () => GetAsyncStorageData()
    }
    else {
      null
    }

  }, [props.links])

  const GetAsyncStorageData = async () => {
    console.log("jhgvwgjvfwevguy")
    const Saved = await AsyncStorage.getItem('links');
    console.log(JSON.parse(Saved))
    if (Saved != null) {
      setlinksGenerated(JSON.parse(Saved))
    }
  }
  const addItem = () => {
    const item = data[Math.floor(Math.random() * data.length)];
    console.log(item)
    const { connected } = Meteor.status();
    if (!connected) {
      setdisconnected(true),
        setlinksGenerated([...linksGenerated, item])
      setdisconnectedData([...disconnectedData, item])
      AsyncStorage.setItem('links', JSON.stringify(linksGenerated))
    } else {
      Meteor.call('links.insert', item.title, item.url, (error) => {
        debugger
        if (error) {
          console.log('error :', error)
        }
      });
    }
  }
  const pressItem = (url) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        }
      })
      .catch((err) => console.log('Linking error: ', err));
  };
  const getAllItems = (status, links) => {
    return (
      <View style={{ backgroundColor: '#f8f8f8', flexGrow: 1 }}>
        <ListItem
          title="Connection Status"
          rightTitle={status.status}
          hideChevron
          rightTitleStyle={{ width: '130%' }}
        />
        {links.map((link) => {
          return (
            <ListItem
              key={link._id}
              title={link.title}
              subtitle={link.url}
              onPress={() => pressItem(link.url)}
            />
          );
        })}
        <TouchableOpacity onPress={() => addItem()}>
          <Icon
            raised
            name='plus'
            type='font-awesome'
            color='#00aced'
            containerStyle={{ bottom: 30, right: 20 }}
            disabled

          />
        </TouchableOpacity>
        <Text>Open up App.js to start working on your app!</Text>
      </View>
    )
  }
  console.log(linksGenerated, disconnectedData)
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexGrow: 1 }}>
        <ScrollView >
          {props.links ? getAllItems(props.status, setlinksGenerated) : <Text>NOT READY</Text>}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default withTracker(params => {

  const linksHandle = Meteor.subscribe('links');
  const loading = !linksHandle.ready();
  const linksExists = !loading;
  return {
    linksExists,
    links: Meteor.collection('links').find({}, { sort: { createdAt: -1 } }),
    status: Meteor.status(),
    //docs: GroundedMeteor.collection('links', 'getUsersById').find({}),
  };
})(RNDemo);
