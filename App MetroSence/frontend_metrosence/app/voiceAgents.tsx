// app/voice-agent.tsx
import React, { useEffect } from "react";
import { View, Text, Button } from "react-native";
import { useVoiceAgent } from "../hooks/useVoiceAgent";

export default function VoiceAgentScreen() {
  const A = useVoiceAgent();

  useEffect(() => { A.askLines(); }, []);

  const handleListen = async () => {
    await A.startListening(async (text) => {
      switch (A.state) {
        case "CHOOSE_LINE":      await A.pickLine(text); break;
        case "CHOOSE_DIRECTION": await A.pickDirection(text); break;
        case "CHOOSE_STATION":   await A.pickStation(text); break;
        case "REVIEW":           await A.confirm(text); break;
      }
    });
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Estado: {A.state}</Text>
      <Button title="🎤 Escuchar" onPress={handleListen} />
      <View style={{ height: 12 }} />
      <Button title="⏹️ Parar" onPress={A.stopListening} />
    </View>
  );
}
