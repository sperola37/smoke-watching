import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryGroup,
  VictoryScatter,
  VictoryLabel,
} from 'victory-native';

export default function StatisticsScreen() {
  const [chartData, setChartData] = useState<{ point: string; count: number }[]>([]);
  const [timeSeriesRed, setTimeSeriesRed] = useState<{ time: number; point: string }[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const watchKeys = keys.filter((k) => k.startsWith('history:'));
      const allEntries = await AsyncStorage.multiGet(watchKeys);

      const pointCount: { [point: string]: number } = {};
      const timeData: { time: number; point: string }[] = [];

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
          const hour = new Date(entry.timestamp).getHours();
          timeData.push({ time: hour, point: address });
        });
      }

      setChartData(Object.entries(pointCount).map(([point, count]) => ({ point, count })));
      setTimeSeriesRed(timeData);
    };


    loadHistory();
  }, []);

  return (
    <ScrollView style={styles.container}>
            <View style={styles.header}>
        <Text style={styles.title}>통계 자료</Text>
      </View>

      <Text style={styles.graphTitle}>지난 주 장소 별 흡연 횟수</Text>

      {/* 막대 그래프 */}
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={300}
        domainPadding={{ x: 50 }}
        padding={{ top: 20, bottom: 50, left: 70, right: 20 }}
        categories={{ x: chartData.map((item) => item.point) }}>
          
        <VictoryAxis
          label="장소 (address)"
          axisLabelComponent={<VictoryLabel dy={25} style={{ fontSize: 12 }} />}
          tickFormat={(t) => String(t)}
          style={{
            tickLabels: { fontSize: 10, textAnchor: 'end', padding: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => Math.round(x)}
          style={{
            tickLabels: { fontSize: 12, padding: 5 },
          }}
        />
        <VictoryGroup offset={25}>
          <VictoryBar
            data={chartData}
            x="point"
            y="count"
            style={{
              data: {
                fill: '#FF0000',
              },
            }}
          />
        </VictoryGroup>
      </VictoryChart>

      <Text style={styles.graphTitle}>지난 주 시간대 별 흡연 횟수</Text>
      {/* 감지 시간 산점도 */}
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={280}
        domain={{ x: [0, 24] }}
        domainPadding={{ y: 50 }}
        padding={{ top: 0, bottom: 40, left: 70, right: 20 }}
      >
        <VictoryAxis
          label="시간 (시)"
          tickValues={[0, 4, 8, 12, 16, 20, 24]}
          style={{
            axisLabel: { padding: 25, fontSize: 12 },
            tickLabels: { fontSize: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickValues={chartData.map((item) => item.point)}
          style={{
            tickLabels: { fontSize: 12, padding: 5 },
          }}
        />
        <VictoryScatter
          data={timeSeriesRed}
          x="time"
          y="point"
          size={6}
          style={{
            data: {
              fill: '#FF0000',
            },
          }}
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
