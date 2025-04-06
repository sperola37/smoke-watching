import { StyleSheet, View, Text, Dimensions, ScrollView } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryGroup, VictoryLegend } from 'victory-native';

// Sample data structure for point status history
const pointStatusData = {
  'Point #1': {
    yellow: 4,
    red: 2,
  },
  'Point #2': {
    yellow: 3,
    red: 1,
  },
};

export default function StatisticsScreen() {
  const chartData = Object.entries(pointStatusData).map(([point, counts]) => [
    { point, status: 'yellow', count: counts.yellow },
    { point, status: 'red', count: counts.red },
  ]).flat();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smoking Incident Statistics</Text>
        <Text style={styles.subtitle}>Status Counts by Watch Point</Text>
      </View>

      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 40}
        height={300}
        domainPadding={{ x: 50 }}>
        <VictoryLegend
          x={Dimensions.get('window').width - 160}
          y={50}
          title="Status"
          centerTitle
          orientation="vertical"
          gutter={20}
          style={{ border: { stroke: "black" }, title: { fontSize: 14 } }}
          data={[
            { name: "Yellow Alert", symbol: { fill: "#FFA500" } },
            { name: "Red Alert", symbol: { fill: "#FF0000" } }
          ]}
        />
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: { fontSize: 12, padding: 5, angle: -45 }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => Math.round(x)}
          style={{
            tickLabels: { fontSize: 12, padding: 5 }
          }}
        />
        <VictoryGroup offset={20}>
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

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Detailed Summary</Text>
        {Object.entries(pointStatusData).map(([point, counts]) => (
          <View key={point} style={styles.pointSummary}>
            <Text style={styles.pointTitle}>{point}</Text>
            <View style={styles.statusCounts}>
              <View style={styles.statusCount}>
                <View style={[styles.statusIndicator, { backgroundColor: '#FFA500' }]} />
                <Text style={styles.countText}>Yellow Alerts: {counts.yellow}</Text>
              </View>
              <View style={styles.statusCount}>
                <View style={[styles.statusIndicator, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.countText}>Red Alerts: {counts.red}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
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
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
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