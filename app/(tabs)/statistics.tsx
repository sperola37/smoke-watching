import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryGroup,
  VictoryScatter,
  VictoryLabel,
} from 'victory-native';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export default function StatisticsScreen() {
  const [chartData, setChartData] = useState<{ point: string; count: number }[]>([]);
  const [timeSeriesRed, setTimeSeriesRed] = useState<{ time: string; yValue: number }[]>([]);
  const [chartDataWeekday, setChartDataWeekday] = useState<{ weekday: string; count: number }[]>([]);
  const [pointIndexMap, setPointIndexMap] = useState<Record<string, number>>({});

  const loadHistory = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const watchKeys = keys.filter((k) => k.startsWith('history:'));
    const allEntries = await AsyncStorage.multiGet(watchKeys);

    const pointCount: Record<string, number> = {};
    const rawTimeData: { time: string; point: string }[] = [];
    const dayCount: number[] = new Array(7).fill(0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const [key, value] of allEntries) {
      const address = key.replace('history:', '');
      const entries = value ? JSON.parse(value) : [];

      const recentEntries = entries.filter((entry: { timestamp: string }) => {
        const ts = new Date(entry.timestamp);
        return ts >= oneWeekAgo;
      });

      pointCount[address] = recentEntries.length;

      recentEntries.forEach((entry: { timestamp: string }) => {
        const date = new Date(entry.timestamp);
        const hour = date.getHours();
        const weekday = date.getDay();
        rawTimeData.push({ time: String(hour), point: address });
        dayCount[weekday]++;
      });
    }

    const pointList = Object.keys(pointCount);
    const pointMap: Record<string, number> = {};
    pointList.forEach((point, idx) => {
      pointMap[point] = idx + 1;
    });

    const timeDataWithNumericY = rawTimeData.map((entry) => ({
      time: entry.time,
      yValue: pointMap[entry.point],
    }));

    const weekdayData = [1, 2, 3, 4, 5, 6, 0].map((dayIdx) => ({
      weekday: weekdayLabels[dayIdx],
      count: dayCount[dayIdx],
    }));

    setPointIndexMap(pointMap);
    setChartData(pointList.map((point) => ({ point, count: pointCount[point] })));
    setTimeSeriesRed(timeDataWithNumericY);
    setChartDataWeekday(weekdayData);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>통계 자료</Text>
      </View>

      <Text style={styles.graphTitle}>지난 주 장소 별 흡연 횟수</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={300}
        domainPadding={{ x: 50 }}
        padding={{ top: 10, bottom: 50, left: 70, right: 20 }}
        categories={{ x: chartData.map((item) => item.point) }}
      >
        <VictoryAxis
          label="장소 (address)"
          axisLabelComponent={<VictoryLabel dy={25} style={{ fontSize: 12 }} />}
          tickFormat={(t) => String(t)}
          style={{ tickLabels: { fontSize: 9, textAnchor: 'middle', padding: 10 } }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => Math.round(x)}
          style={{ tickLabels: { fontSize: 12, padding: 5 } }}
        />
        <VictoryGroup offset={25}>
          <VictoryBar
            data={chartData}
            x="point"
            y="count"
            style={{ data: { fill: '#FF0000' } }}
          />
        </VictoryGroup>
      </VictoryChart>

      <Text style={styles.graphTitle}>지난 주 시간대 별 흡연 횟수</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={280}
        domainPadding={{ x: 20, y: 10 }}
        padding={{ top: 10, bottom: 40, left: 70, right: 20 }}
        categories={{ x: Array.from({ length: 25 }, (_, i) => String(i)) }}
      >
        <VictoryAxis
          label="시간 (시)"
          tickValues={["0", "4", "8", "12", "16", "20", "24"]}
          tickFormat={(t) => t}
          style={{
            axisLabel: { padding: 25, fontSize: 12 },
            tickLabels: { fontSize: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickValues={Object.values(pointIndexMap)}
          tickFormat={(val) => Object.entries(pointIndexMap).find(([_, v]) => v === val)?.[0] ?? ''}
          style={{ tickLabels: { fontSize: 10, padding: 2 } }}
        />
        <VictoryScatter
          data={timeSeriesRed}
          x="time"
          y="yValue"
          size={3}
          style={{ data: { fill: '#FF0000' } }}
        />
      </VictoryChart>

      <Text style={styles.graphTitle}>지난 주 요일 별 흡연 횟수</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={280}
        domainPadding={{ x: 30 }}
        padding={{ top: 10, bottom: 40, left: 70, right: 20 }}
        categories={{ x: ['월', '화', '수', '목', '금', '토', '일'] }}
      >
        <VictoryAxis
          label="요일"
          tickFormat={(t) => t}
          style={{
            axisLabel: { padding: 25, fontSize: 12 },
            tickLabels: { fontSize: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => Math.round(x)}
          style={{ tickLabels: { fontSize: 12, padding: 5 } }}
        />
        <VictoryBar
          data={chartDataWeekday}
          x="weekday"
          y="count"
          style={{ data: { fill: '#FF0000' } }}
        />
      </VictoryChart>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 40,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 5,
    color: '#343a40',
  },
});
