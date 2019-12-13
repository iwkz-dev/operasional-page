import IncomeInfo from './IncomeInfo.js';
import BillInfo from './BillInfo.js';
import WebSocketHandler from './WebSocketHandler.js';

const billInfo = new BillInfo();
const incomeInfo = new IncomeInfo();
const webSocketHandler = new WebSocketHandler(incomeInfo, billInfo);

billInfo.run();
incomeInfo.run();
webSocketHandler.run();
