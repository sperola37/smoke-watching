import { StyleSheet, View, Text, Dimensions, ScrollView } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryGroup, VictoryLine, VictoryScatter } from 'victory-native';

// 예시 데이터
const pointStatusData = {
  '감시점 #1': {
    yellow: 4,
    red: 2,
  },
  '감시점 #2': {
    yellow: 3,
    red: 1,
  },
  '감시점 #3': {
    yellow: 3,
    red: 4,
  },
};

const timeSeriesYellow = [
  { time: 1, point: '감시점 #1' },
  { time: 10, point: '감시점 #1' },
  { time: 18, point: '감시점 #2' },
  { time: 14, point: '감시점 #3' },
];

const timeSeriesRed = [
  { time: 3, point: '감시점 #1' },
  { time: 6, point: '감시점 #2' },
  { time: 13, point: '감시점 #2' },
  { time: 7, point: '감시점 #3' },
];

export default function StatisticsScreen() {
  const chartData = Object.entries(pointStatusData).map(([point, counts]) => [
    { point, status: 'yellow', count: counts.yellow },
    { point, status: 'red', count: counts.red },
  ]).flat();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>통계 자료</Text>
      </View>

      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={300}
        domainPadding={{ x: 50 }}
        padding={{ top: 20, bottom: 50, left: 70, right: 20 }}>
   
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: { fontSize: 12, padding: 5, angle: 0 }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => Math.round(x)}
          style={{
            tickLabels: { fontSize: 12, padding: 5 }
          }}
        />
        <VictoryGroup offset={25}>
          <VictoryBar
            data={chartData.filter(d => d.status === 'yellow')}
            x="point"
            y="count"
            style={{
              data: {
                fill: "#FFA500",
              }
            }}
          />
          <VictoryBar
            data={chartData.filter(d => d.status === 'red')}
            x="point"
            y="count"
            style={{
              data: {
                fill: "#FF0000",
              }
            }}
          />
        </VictoryGroup>
      </VictoryChart>

      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={300}
        domain={{ x: [0, 24] }}
        domainPadding={{ y: 50 }}
        padding={{ top: 20, bottom: 50, left: 70, right: 20 }}
      >
        <VictoryAxis
          label="시간 (시)"
          tickValues={[0, 4, 8, 12, 16, 20, 24]}
          style={{
            axisLabel: { padding: 30, fontSize: 12 },
            tickLabels: { fontSize: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: { fontSize: 12, padding: 0 },
          }}
        />

        {/* Yellow Alert: Line + Points */}
        <VictoryLine
          data={timeSeriesYellow}
          x="time"
          y="point"
          style={{ data: { stroke: '#FFA500', strokeWidth: 2 } }}
        />
        <VictoryScatter
          data={timeSeriesYellow}
          x="time"
          y="point"
          size={5}
          style={{ data: { fill: '#FFA500' } }}
        />

        {/* Red Alert: Line + Points */}
        <VictoryLine
          data={timeSeriesRed}
          x="time"
          y="point"
          style={{ data: { stroke: '#FF0000', strokeWidth: 2 } }}
        />
        <VictoryScatter
          data={timeSeriesRed}
          x="time"
          y="point"
          size={5}
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
  summaryContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212529',
  },
  pointSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#343a40',
  },
  statusCounts: {
    gap: 8,
  },
  statusCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  countText: {
    fontSize: 16,
    color: '#495057',
  },
});