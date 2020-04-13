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

  initBill() {
    getBillData(currentMonthNumber, currentYear)
      .then(({ data: { data } }) => {
        this.updateData(data[0])
      })
  }

  updateData({ totalBills, totalBillByTypes }) {
    this.totalBillCounter.update(totalBills);

    const pieChartData = this.extractTotalWithEachType(totalBillByTypes);
    this.pieChart.updateData(pieChartData);
    this.pieChart.render();
  }

  extractTotalWithEachType(totalBillByTypes) {
    const keys = Object.keys(totalBillByTypes);

    return keys.map((key) => ({
      y: totalBillByTypes[key],
      label: key,
    }));
  }
}

export default BillInfo;
