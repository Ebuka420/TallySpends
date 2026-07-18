import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Heartbeat } from '../icons';

const GaugeChart = ({ score = 82 }) => {
  const radius = 40;
  const circumference = Math.PI * radius; // ~125.66
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width="120" height="75" viewBox="0 0 100 60" style={{ overflow: 'visible' }}>
        {/* Background Arc */}
        <Path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#f1eef0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Foreground Active Arc */}
        <Path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
        
        {/* Gradients */}
        <Defs>
          <LinearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8d728b" />
            <Stop offset="100%" stopColor="#3d2e3c" />
          </LinearGradient>
        </Defs>
      </Svg>

      {/* Center Heartbeat Icon */}
      <View style={styles.iconCircle}>
        <Heartbeat size={15} color="#3d2e3c" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 120,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  iconCircle: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1eef0',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default GaugeChart;
