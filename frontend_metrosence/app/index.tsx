import { View, Text } from 'react-native'
import React from 'react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import Main from '../components/Main'

const HomeScreen = () => {
  return (
    <View>
      <Header />
      <Hero />
      <Main/>
    </View>
  )
}

export default HomeScreen