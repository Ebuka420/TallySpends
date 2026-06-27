import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const BreakdownChart = ({ breakdown = [], totalExpenses = 0 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = 26;
  const strokeWidth = 8;
  const strokeWidthHover = 11;
  const circumference = 2 * Math.PI * radius; // ~163.36

  let accumulatedPercent = 0;

  const formatCurrency = (val) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      {/* Donut Circle */}
      <View style={styles.donutContainer}>
        <Svg width="110" height="110" viewBox="0 0 80 80">
          <Circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="#f9f9fa"
            strokeWidth={strokeWidth}
          />
          {breakdown.map((item, index) => {
            const strokeLength = (item.percentage / 100) * circumference;
            const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;
            
            const isHovered = hoveredIndex === index;

            return (
              <Circle
                key={item.name}
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidthHover : strokeWidth}
                strokeDasharray={`${strokeLength}, ${circumference}`}
                strokeDashoffset={strokeOffset}
                rotation="-90"
                origin="40, 40"
              />
            );
          })}
        </Svg>

        {/* Center Text inside Donut */}
        <View style={styles.centerTextContainer}>
          {hoveredIndex !== null ? (
            <View style={{ alignItems: 'center' }}>
              <Text numberOfLines={1} style={styles.centerLabelTiny}>
                {breakdown[hoveredIndex].name}
              </Text>
              <Text style={styles.centerValueSmall}>
                {formatCurrency(breakdown[hoveredIndex].value)}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.centerValue}>
                {formatCurrency(totalExpenses)}
              </Text>
              <Text style={styles.centerLabel}>Total Spent</Text>
            </View>
          )}
        </View>
      </View>

      {/* Legend Column */}
      <View style={styles.legendContainer}>
        {breakdown.map((item, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <Pressable
              key={item.name}
              style={[
                styles.legendRow,
                isHovered && styles.legendRowHovered
              ]}
              onPressIn={() => setHoveredIndex(index)}
              onPressOut={() => setHoveredIndex(null)}
            >
              <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendName, isHovered && styles.legendNameHovered]}>
                  {item.name}
                </Text>
              </View>
              <Text style={styles.legendPercent}>{item.percentage}%</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  donutContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    pointerEvents: 'none',
  },
  centerValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  centerLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#706870',
    marginTop: 2,
  },
  centerValueSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  centerLabelTiny: {
    fontSize: 8,
    fontWeight: '600',
    color: '#706870',
    textAlign: 'center',
    maxWidth: 70,
  },
  legendContainer: {
    flex: 1,
    minWidth: 140,
    gap: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  legendRowHovered: {
    backgroundColor: '#f5eff3',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendName: {
    fontSize: 10,
    color: '#706870',
  },
  legendNameHovered: {
    fontWeight: '700',
    color: '#1f1a1f',
  },
  legendPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f1a1f',
  }
});

export default BreakdownChart;
