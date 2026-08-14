import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const TrendsChart = ({ data }) => {
  const { labels = [], datasets = [], hoverDetails = [] } = data;
  const [activeIndex, setActiveIndex] = useState(2); // Default to middle index (May 15)

  useEffect(() => {
    if (labels && labels.length > 0) {
      setActiveIndex(Math.floor(labels.length / 2));
    }
  }, [labels]);

  const width = screenWidth - 64; // accounts for page margins
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allValues = datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues, 100);

  let yMax = 4000;
  let yStep = 1000;
  let formatLabel = (v) => `$${v / 1000}k`;

  if (maxValue <= 200) {
    yMax = 200;
    yStep = 50;
    formatLabel = (v) => `$${v}`;
  } else if (maxValue <= 4000) {
    yMax = 4000;
    yStep = 1000;
    formatLabel = (v) => v === 0 ? '$0' : `$${v / 1000}k`;
  } else {
    yMax = 12000;
    yStep = 3000;
    formatLabel = (v) => v === 0 ? '$0' : `$${v / 1000}k`;
  }

  // Calculate coordinates mapping
  const getCoords = (dataList) => {
    return dataList.map((val, idx) => {
      const x = paddingLeft + (idx / (labels.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (val / yMax) * chartHeight;
      return { x, y };
    });
  };

  // Convert points to Bezier curve
  const getBezierPath = (points) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const activeDetails = hoverDetails[activeIndex] || {};
  const activeX = paddingLeft + (activeIndex / (labels.length - 1)) * chartWidth;

  // Render horizontal gridlines & labels
  const gridLines = [];
  for (let val = 0; val <= yMax; val += yStep) {
    const y = paddingTop + chartHeight - (val / yMax) * chartHeight;
    gridLines.push(
      <React.Fragment key={val}>
        <Line
          x1={paddingLeft}
          y1={y}
          x2={width - paddingRight}
          y2={y}
          stroke="#f1eef0"
          strokeWidth="1"
          strokeDasharray={val === 0 ? "0" : "3,3"}
        />
        <SvgText
          x={paddingLeft - 6}
          y={y + 3}
          fill="#706870"
          fontSize="9"
          textAnchor="end"
        >
          {formatLabel(val)}
        </SvgText>
      </React.Fragment>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: height, width: width, position: 'relative' }}>
        <Svg width={width} height={height}>
          {gridLines}

          {/* Vertical indicator line */}
          <Line
            x1={activeX}
            y1={paddingTop}
            x2={activeX}
            y2={height - paddingBottom}
            stroke="#b0aab0"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />

          {/* Render lines */}
          {datasets.map((ds, index) => {
            const points = getCoords(ds.data);
            const pathD = getBezierPath(points);
            const activePoint = points[activeIndex];

            return (
              <React.Fragment key={ds.name}>
                <Path
                  d={pathD}
                  fill="none"
                  stroke={ds.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {activePoint && (
                  <Circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4"
                    fill={ds.color}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* X Axis Labels */}
          {labels.map((label, idx) => {
            const x = paddingLeft + (idx / (labels.length - 1)) * chartWidth;
            const isActive = idx === activeIndex;
            return (
              <SvgText
                key={label}
                x={x}
                y={height - paddingBottom + 14}
                fill={isActive ? "#1f1a1f" : "#706870"}
                fontSize="9"
                fontWeight={isActive ? "700" : "400"}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>

        {/* Hover/Tap tracking transparent regions */}
        <View style={[styles.touchOverlayRow, { left: paddingLeft, width: chartWidth, height: chartHeight, top: paddingTop }]}>
          {labels.map((_, idx) => (
            <Pressable
              key={idx}
              style={styles.touchColumn}
              onPressIn={() => setActiveIndex(idx)}
            />
          ))}
        </View>
      </View>

      {/* Floating Tooltip Box */}
      {activeDetails && (
        <View
          style={[
            styles.tooltip,
            {
              left: activeX,
              transform: [{ translateX: activeX > width / 2 ? -115 : 10 }],
            }
          ]}
        >
          <Text style={styles.tooltipDay}>{activeDetails.day}</Text>
          {datasets.map(ds => {
            const val = activeDetails[ds.name];
            return (
              <View key={ds.name} style={styles.tooltipRow}>
                <View style={styles.tooltipLabelCol}>
                  <View style={[styles.colorDot, { backgroundColor: ds.color }]} />
                  <Text style={styles.tooltipLabel}>{ds.name}</Text>
                </View>
                <Text style={styles.tooltipVal}>
                  ${val !== undefined ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    position: 'relative',
    alignItems: 'center',
  },
  touchOverlayRow: {
    position: 'absolute',
    flexDirection: 'row',
    zIndex: 20,
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
  tooltip: {
    position: 'absolute',
    top: '12%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1eef0',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    minWidth: 105,
    zIndex: 30,
  },
  tooltipDay: {
    fontSize: 9,
    fontWeight: '700',
    color: '#706870',
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 1.5,
  },
  tooltipLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  tooltipLabel: {
    fontSize: 9,
    color: '#706870',
  },
  tooltipVal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1f1a1f',
  }
});

export default TrendsChart;
