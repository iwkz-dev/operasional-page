import { API_URL, WS_ENDPOINT, FINANCE_WS_URI } from './config.js';

class WebSocketHandler {
  constructor(incomeInfo, billInfo) {
    this.incomeInfo = incomeInfo;
    this.billInfo = billInfo;

    const socket = new SockJS(`${API_URL}${WS_ENDPOINT}`);

    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = false;
  }

  run() {
    this.stompClient.connect({}, () => {
      this.stompClient.subscribe(FINANCE_WS_URI, ({ body }) => {
        const data = JSON.parse(body,  true);
        const {
          incomePercentageResponse,
          totalIncomeResponse,
          totalBillResponse,
        } = data;

        // update income
        this.incomeInfo.updateMainIncomeData(incomePercentageResponse);
        this.incomeInfo.updateData(totalIncomeResponse);

        // update bill
        this.billInfo.updateData(totalBillResponse)
      });
    });
  }
}

export default WebSocketHandler;