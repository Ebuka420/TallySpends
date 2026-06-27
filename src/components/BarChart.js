import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const BarChart = ({ labels = [], income = [], expenses = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const maxVal = Math.max(...income, ...expenses, 1000);
  const yLimit = Math.ceil(maxVal / 1000) * 1000;
  
  const yMarkers = [];
  for (let i = yLimit; i >= 0; i -= yLimit / 4) {
    yMarkers.push(i);
  }

  const formatCurrency = (val) => {
    return `$${val.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        
        {/* Y Axis Ticks */}
        <View style={styles.yAxis}>
          {yMarkers.map((marker, idx) => (
            <Text key={idx} style={styles.yLabel}>
              {marker === 0 ? '$0' : `$${marker / 1000}k`}
            </Text>
          ))}
        </View>

        {/* Grid Plot Area */}
        <View style={styles.plotArea}>
          {/* Horizontal lines */}
          <View style={styles.gridLines}>
            {yMarkers.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.gridLine, 
                  idx === yMarkers.length - 1 && { borderTopWidth: 0 }
                ]} 
              />
            ))}
          </View>

          {/* Bar Groups */}
          <View style={styles.barsContainer}>
            {labels.map((label, idx) => {
              const incVal = income[idx] || 0;
              const expVal = expenses[idx] || 0;

              const incHeight = (incVal / yLimit) * 100;
              const expHeight = (expVal / yLimit) * 100;

              const isActive = activeIndex === idx;

              return (
                <Pressable
                  key={label}
                  style={[
                    styles.barGroup,
                    isActive && styles.barGroupActive
                  ]}
                  onPressIn={() => setActiveIndex(idx)}
                  onPressOut={() => setActiveIndex(null)}
                >
                  {/* Income (Green) */}
                  <View 
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      { height: `${incHeight}%` }
                    ]}
                  />

                  {/* Expense (Deep Plum) */}
                  <View 
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { height: `${expHeight}%` }
                    ]}
                  />

                  {/* Tooltip Overlay */}
                  {isActive && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipTitle}>{label}</Text>
                      <Text style={styles.tooltipInc}>Inc: {formatCurrency(incVal)}</Text>
                      <Text style={styles.tooltipExp}>Exp: {formatCurrency(expVal)}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

        </View>
      </View>

      {/* X Axis Labels */}
      <View style={styles.xAxis}>
        {labels.map((label, idx) => (
          <Text 
            key={label} 
            style={[
              styles.xLabel,
              activeIndex === idx && styles.xLabelActive
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160,
    marginVertical: 10,
  },
  chartWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    height: '100%',
    paddingBottom: 2,
  },
  yLabel: {
    fontSize: 9,
    color: '#706870',
  },
  plotArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f1eef0',
    position: 'relative',
    height: '100%',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#fcfafc',
    borderStyle: 'dashed',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    zIndex: 5,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: '100%',
    paddingHorizontal: 4,
    borderRadius: 6,
    position: 'relative',
  },
  barGroupActive: {
    backgroundColor: '#f5eff3',
  },
  bar: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  incomeBar: {
    backgroundColor: '#34a853',
  },
  expenseBar: {
    backgroundColor: '#3d2e3c',
  },
  xAxis: {
    flexDirection: 'row',
    paddingLeft: 30,
    justifyContent: 'space-around',
    marginTop: 6,
  },
  xLabel: {
    fontSize: 9,
    color: '#706870',
    width: 32,
    textAlign: 'center',
  },
  xLabelActive: {
    fontWeight: '700',
    color: '#1f1a1f',
  },
  tooltip: {
    position: 'absolute',
    bottom: '102%',
    left: '50%',
    transform: [{ translateX: -45 }],
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1eef0',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: 90,
    zIndex: 30,
  },
  tooltipTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#706870',
    borderBottomWidth: 1,
    borderBottomColor: '#f1eef0',
    paddingBottom: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  tooltipInc: {
    fontSize: 8,
    color: '#34a853',
    fontWeight: '600',
  },
  tooltipExp: {
    fontSize: 8,
    color: '#3d2e3c',
    fontWeight: '600',
  }
});

export default BarChart;
