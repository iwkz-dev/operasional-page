import { getBillData } from './dataService.js';
import PieChart from './pieChart.js';
import NumberCountUp from './NumberCountUp.js';

class BillInfo {
  constructor() {
    const billChart = 'billChart';
    const totalBill = 'totalBill';

    this.totalBillCounter = new NumberCountUp(totalBill);
    this.totalBillCounter.setup();

    this.pieChart = new PieChart(billChart);
    this.pieChart.setup();
  }

  run() {
    this.initBill();
  }

  getTotalBillCounter() {
    return this.totalBillCounter;
  }

  getPieChart() {
    return this.pieChart;
  }

  initBill() {
    getBillData()
      .then(({ data: { data } }) => {
        const { totalBills, totalBillByTypes } = data[0];

        this.totalBillCounter.update(totalBills);

        const pieChartData = this.extractTotalWithEachType(totalBillByTypes);
        this.pieChart.updateData(pieChartData);
        this.pieChart.render();
      })
  }

  extractTotalWithEachType(totalBillByTypes) {
    const keys = Object.keys(totalBillByTypes);

    return keys.map((key) => ({
      y: totalBillByTypes[key],
      label: key,
    }));
  }

  progressBar(percentage) {
    const billPercentage = $('#billPercentage');
    const percentageText = $(billPercentage).find('span');
    const percentageBar = $(billPercentage).find('.progress-bar');

    percentageText.text(`${percentage}%`);
    percentageBar.css('width', `${percentage}%`);
    percentageBar.attr('aria-valuenow', percentage);
  }
}

export default BillInfo;
