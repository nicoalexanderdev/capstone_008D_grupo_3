// app/asistente.tsx (voz para pedir permisos + confirmar/denegar)
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import SlideMenu from '../components/SlideMenu';
import * as Speech from "expo-speech";

// Hook de voz reutilizable
import { useVoiceCapture } from '../hooks/useVoiceCapture';

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!¡¿?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function intentFromSpeech(text: string): 'accept' | 'deny' | 'back' | 'none' {
  const t = normalize(text);
  if (!t) return 'none';
  // aceptar: permitir, aceptar, conceder, otorgar, si, sí, ok, continuar
  if (/\b(permitir|aceptar|conceder|otorgar|si|sí|ok|continuar)\b/.test(t)) return 'accept';
  // denegar: no, rechazar, denegar, cancelar
  if (/\b(no|rechazar|denegar|cancelar)\b/.test(t)) return 'deny';
  // volver atrás
  if (t.includes('volver atras') || t.includes('volver atrás') || /\b(atras|atrás|regresar|volver)\b/.test(t)) return 'back';
  return 'none';
}

export default function AssistantScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [menuOpen, setMenuOpen] = useState(false);

  const granted = !!permission?.granted;

  // Hook de voz: lee el mensaje y escucha la respuesta del usuario
  const { isListening, recognizedText, start, stop, speakThenListen, interruptTTSAndStart } = useVoiceCapture({
    lang: 'es-CL',
    onFinalText: async (finalText) => {
      const intent = intentFromSpeech(finalText);
      if (intent === 'accept') {
        const res = await requestPermission();
        if (res?.granted) {
          // Confirmar por voz que se concedió
          Speech.speak('Permiso concedido. La cámara está lista. Puedes decir volver para regresar.');
        } else {
          speakThenListen('No se concedió el permiso. ¿Deseas intentarlo otra vez? Di permitir u ok, o di no para cancelar.');
        }
        return;
      }
      if (intent === 'deny') {
        speakThenListen('Entendido, no activaré la cámara. Puedes decir volver para regresar.');
        return;
      }
      if (intent === 'back') {
        router.back();
        return;
      }
      // Si no entendimos, repreguntamos
      if (!granted) {
        speakThenListen('No te escuché bien. ¿Deseas permitir el uso de la cámara? Di permitir u ok, o di no para cancelar.');
      }
    },
  });

  // Al entrar o cuando cambie el estado de permisos, anuncia y activa escucha
  useEffect(() => {
    if (!permission) return; // aún cargando
    if (granted) {
      // Ya está concedido
      Speech.speak('Permiso de cámara concedido.', {language:'es'});
    } else {
      speakThenListen('Para continuar necesito tu permiso para usar la cámara. Di permitir u ok para conceder, o di no para cancelar.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granted, !!permission]);

  return (
    <View style={styles.root}>
      <Header onReportPress={() => router.push('/report')} />

      {!granted ? (
        <View style={styles.permissionsContainer}>
          <Text style={styles.message}>
            Necesitamos tu permiso para usar la cámara. También puedes responder por voz.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryText}>Conceder permiso</Text>
          </Pressable>

          {/* Botón manual de micrófono */}
          <Pressable
            onPress={() => {
              if (isListening) {
                stop();
              } else {
                interruptTTSAndStart(); 
              }
            }}
            style={[styles.micBtn, isListening && { opacity: 0.85 }]}
          >
            <Text style={styles.micText}>{isListening ? 'Detener' : 'Grabar'}</Text>
          </Pressable>

          {!!recognizedText && (
            <Text style={styles.recognized}>Escuché: {recognizedText}</Text>
          )}
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={facing} />

          {/* Mic para comandos una vez concedido (ej. "volver") */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
            <Pressable
              onPress={() => {
              if (isListening) {
                stop();
              } else {
                interruptTTSAndStart(); 
              }
            }}
              style={[styles.micBtn, isListening && { opacity: 0.85 }]}
            >
              <Text style={styles.micText}>{isListening ? 'Detener' : 'Grabar'}</Text>
            </Pressable>
            {!!recognizedText && (
              <Text style={styles.recognized}>Escuché: {recognizedText}</Text>
            )}
          </View>
        </View>
      )}

      <Footer onBackPress={() => {Speech.stop(); router.back();}} onMenuPress={() => setMenuOpen(true)} onHomePress={() => {Speech.stop(); router.replace('/')}} />
      <SlideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0f' },
  permissionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  cameraContainer: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 12, color: 'white', opacity: 0.9 },
  primaryBtn: { marginTop: 6, backgroundColor: '#7dd3fc', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  primaryText: { color: '#0b0b0f', fontWeight: '700' },
  camera: { flex: 1 },
  buttonContainer: {
    position: 'absolute', bottom: 64, flexDirection: 'row', backgroundColor: 'transparent', width: '100%', paddingHorizontal: 64,
  },
  button: { flex: 1, alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  micBtn: { marginTop: 16, backgroundColor: '#cbd5e1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  micText: { color: '#0b0b0f', fontWeight: '700' },
  recognized: { color: 'white', marginTop: 8, opacity: 0.8 },
});
