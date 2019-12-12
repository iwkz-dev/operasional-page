class PieChart {
  constructor(chartDomId) {
    this.chartDomId = chartDomId;
    this.pieChart = null;
  }

  updateData(newData) {
    this.pieChart.options.data[0].dataPoints = newData;
  }

  render() {
    if (!this.pieChart) {
      console.error("chart not yet setup!");
      return;
    }

    return this.pieChart.render();
  }

  setup() {
    if (!this.chartDomId) {
      console.error("chart dom id not yet set!");
      return;
    }

    this.pieChart = new CanvasJS.Chart(this.chartDomId, {
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      animationEnabled: true,
      data: [{
        type: "pie",
        startAngle: 25,
        toolTipContent: "<b>{label}</b>: {y} €",
        legendText: "{label}",
        indexLabelFontSize: 16,
        indexLabel: "{label} - {y} €",
        dataPoints: [],
      }]
    });
  }
}

export default PieChart;