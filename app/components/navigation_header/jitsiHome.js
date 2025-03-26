import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  PermissionsAndroid,
} from "react-native";

import colors from "../utils/colors";
import { WebView } from "react-native-webview";




export default function MapScreen({ navigation }) {

  useEffect(() => {
    setItems();
  }, []);



  function onSignIn() {}

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://beta.meet.jit.si/serj_teamup" }}
        style={{ flex: 1 }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  MapStyle: {
    width: "100%",
    height: "100%",
    pinColor: "green",
  },
  container: {
    flex: 1,
    backgroundColor: colors.classicBackground,
    position: "relative",
    zIndex: 2,
  },
  content: {
    backgroundColor: colors.classicBackground,
    padding: 16,
    marginBottom: 120,
  },
  headerButtonLeft: {
    position: "absolute",
    backgroundColor: colors.classicMain,
    borderRadius: 25,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    top: 50,
    left: 16,
    zIndex: 1,
  },
  headerButtonLeft2: {
    position: "absolute",
    backgroundColor: colors.classicMain,
    borderRadius: 25,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    top: 100,
    left: 16,
    zIndex: 1,
  },
  headerButtonRight: {
    position: "absolute",
    backgroundColor: colors.classicMain,
    borderRadius: 25,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    top: 50,
    right: 16,
    zIndex: 1,
    paddingLeft: 2,
  },
  blockBtn: {
    width: "100%",
    position: "absolute",
    backgroundColor: colors.classicWidgetBackground,
    paddingVertical: 10,
    paddingHorizontal: 10,
    bottom: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  Button: {
    backgroundColor: colors.classicMain,
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  txtButton: {
    color: colors.classicFontColorOnDark,
    fontSize: 18,
    textAlign: "center",
  },
});
