import { View, Text } from 'react-native'
import React from 'react'
import SentidoButton from '../components/SentidoButton'
import { Header } from '../components/Header'

export default function sentido() {
  return (
    <View>
      <Header/>
      <SentidoButton estacion="San Pablo" />
      <SentidoButton estacion="Los Dominicos"/>
    </View>
  )
}