import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const HeatMap = ({ heatmapData }) => {
  const { matrix = [] } = heatmapData;
  const [hoveredCell, setHoveredCell] = useState(null);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeLabels = ["12 AM", "2 AM", "4 AM", "6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM", "10 PM"];
  
  const getXLabel = (index) => {
    if (index === 3) return "6 AM";
    if (index === 6) return "12 PM";
    if (index === 9) return "6 PM";
    if (index === 0) return "12 AM";
    return null;
  };

  const getCellColor = (value) => {
    if (value <= 1) return '#fbfafb';
    if (value === 2) return '#f3edf2';
    if (value === 3) return '#e6dae4';
    if (value === 4) return '#d8c7d6';
    if (value === 5) return '#c8b1c5';
    if (value === 6) return '#b79cb3';
    if (value === 7) return '#a3849f';
    if (value === 8) return '#8c6888';
    return '#3d2e3c'; // value >= 9
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridWrapper}>
        
        {/* Y Axis (Days) */}
        <View style={styles.yAxis}>
          {days.map(day => (
            <Text key={day} style={styles.yLabel}>{day}</Text>
          ))}
        </View>

        {/* Heatmap Grid plot */}
        <View style={styles.gridPlot}>
          {matrix.map((row, dayIdx) => (
            <View key={dayIdx} style={styles.row}>
              {row.map((val, timeIdx) => {
                const isHovered = hoveredCell && hoveredCell.dayIdx === dayIdx && hoveredCell.timeIdx === timeIdx;
                
                return (
                  <Pressable
                    key={timeIdx}
                    style={[
                      styles.cell,
                      { backgroundColor: getCellColor(val) },
                      isHovered && styles.cellActive
                    ]}
                    onPressIn={() => setHoveredCell({ dayIdx, timeIdx, val })}
                    onPressOut={() => setHoveredCell(null)}
                  >
                    {isHovered && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>
                          {days[dayIdx]} {timeLabels[timeIdx]}: Lvl {val}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* X Axis (Times) */}
          <View style={styles.xAxis}>
            {timeLabels.map((lbl, idx) => {
              const displayLabel = getXLabel(idx);
              if (!displayLabel) return null;
              
              // Positioning markers manually for align
              return (
                <Text key={idx} style={styles.xLabel}>
                  {displayLabel}
                </Text>
              );
            })}
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  gridWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  yAxis: {
    width: 25,
    height: 112,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#706870',
    height: 14,
    textAlignVertical: 'center',
  },
  gridPlot: {
    flex: 1,
    gap: 2,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    height: 14,
  },
  cell: {
    flex: 1,
    borderRadius: 2,
    position: 'relative',
  },
  cellActive: {
    borderWidth: 1,
    borderColor: '#1f1a1f',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  xLabel: {
    fontSize: 9,
    color: '#706870',
    width: 40,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -45 }],
    backgroundColor: '#ffffff',
    borderColor: '#f1eef0',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    width: 90,
    zIndex: 40,
  },
  tooltipText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1f1a1f',
    textAlign: 'center',
  }
});

export default HeatMap;
