import React, { useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import JitsiMeet from 'react-native-jitsi-meet';

const JitsiMeetComponent = ({ roomName }) => {
  useEffect(() => {
    // Инициализация Jitsi при монтировании компонента
    return () => {
      JitsiMeet.endCall(); // Завершаем звонок при размонтировании
    };
  }, []);

  const startMeeting = () => {
    const url = `https://meet.jit.si/${roomName}`; // Ссылка на комнату
    const userInfo = {
      displayName: 'Пользователь',
      email: 'user@example.com',
      avatar: 'https://example.com/avatar.png', // Ссылка на аватар (опционально)
    };

    JitsiMeet.call(url, userInfo);
  };

  const endMeeting = () => {
    JitsiMeet.endCall();
  };

  return (
    <View style={styles.container}>
      <Button title="Начать встречу" onPress={startMeeting} />
      <Button title="Закончить встречу" onPress={endMeeting} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default JitsiMeetComponent;
