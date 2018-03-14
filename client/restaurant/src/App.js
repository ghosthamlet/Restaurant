import React, { Component } from 'react';
import './App.css';

import {Row, Col, Tab, Panel, PageHeader, Button} from 'react-bootstrap';


import SideBar from './components/SideBar';
import Orders from './components/Orders';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      products: [],
      orders: [],
    };

    this.updateOrder = this.updateOrder.bind(this);
    this.updateOrderStatus = this.updateOrderStatus.bind(this);
    this.updateOrderProducts = this.updateOrderProducts.bind(this);
    this.showAll = this.showAll.bind(this);
    this.showPrevDay = this.showPrevDay.bind(this);
    this.showToday = this.showToday.bind(this);
    this.getDate = this.getDate.bind(this);

    this.currentDate = 0;
    this.remarkItems = [
      ['男', '女'],
      ['老年', '中年', '青年', '少年', '小孩'],
      ['一人', '两人', '三人', '多人'],
      ['长发', '短发'],
      ['高', '矮'],
      ['胖', '瘦'],
      ['红衣', '黄衣', '蓝衣', '黑衣', '白衣'],
      ['特辣', '中辣', '微辣', '不辣'],
      ['多蔬', '多肉'], 
      ['多面', '少面']
    ];
  }

  loadProducts() {
    return fetch('http://localhost:5000/api/product')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            products: result.objects
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  loadOrders(startDate, endDate) {
    let filters = startDate && endDate ? 
      [{name: 'created_at', op: '>=', val: startDate}, 
       {name: 'created_at', op: '<=', val: endDate}]
      : [];
    const q = JSON.stringify({
      filters: filters,
      order_by: [{field: 'id', direction: 'desc'}]
    });

    return fetch('http://localhost:5000/api/order?q=' + q)
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            orders: result.objects
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  updateOrder() {
    this.loadOrders();
  }

  updateOrderStatus(orderId, status) {
    let orders = this.state.orders.map(o => o);
    orders.filter(o => o.id === orderId)[0].status = status;
    this.setState({orders});
  }

  updateOrderProducts() {
    this.loadOrders();
  }

  showAll() {
    this.currentDate = 0;
    this.loadOrders();
  }

  showPrevDay() {
    this.currentDate++;
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - this.currentDate)
    startDate.setHours(0);
    let endDate = new Date();
    endDate.setDate(endDate.getDate() - this.currentDate)
    endDate.setHours(24);
    this.loadOrders(this.formatDateTime(startDate), this.formatDateTime(endDate));
  }

  showToday() {
    this.currentDate = 0;
    let startDate = new Date();
    startDate.setHours(0);
    let endDate = new Date();
    endDate.setHours(24);
    this.loadOrders(this.formatDateTime(startDate), this.formatDateTime(endDate));
  }

  getDate() {
    let date = new Date();
    date.setDate(date.getDate() - this.currentDate)
    return this.formatDate(date);
  }

  formatDate(dateObj) {
    return dateObj.getFullYear() + '-' + (dateObj.getMonth()+1)
      + '-' + dateObj.getDate();
  }

  formatDateTime(dateObj) {
    return this.formatDate(dateObj) + ' ' + dateObj.getHours() + ':00';
  }

  componentDidMount() {
    this.loadProducts()
      .then(this.loadOrders.bind(this));
  }
  
  render() {
    return (
      <Panel>
        <Panel.Body>
          <PageHeader>
                点餐&nbsp;&nbsp;
                {this.getDate()}
                <Button onClick={this.showToday}>今天</Button>
                <Button onClick={this.showPrevDay}>上一天</Button>
                <Button onClick={this.showAll}>全部</Button>
          </PageHeader>
            <Tab.Container defaultActiveKey="unpaid">
              <Row className="clearfix">
                <Col sm={2}>
                    <SideBar products={this.state.products} updateOrder={this.updateOrder} remarkItems={this.remarkItems} />
                </Col>
                <Col sm={9}>
                  <Tab.Content animation>
                    <Tab.Pane eventKey="unpaid">
                      <Orders orders={this.state.orders} products={this.state.products} status={'unpaid'}
                              updateOrderStatus={this.updateOrderStatus} updateOrderProducts={this.updateOrderProducts} remarkItems={this.remarkItems} />
                    </Tab.Pane>
                    <Tab.Pane eventKey="paid">
                      <Orders orders={this.state.orders} products={this.state.products} status={'paid'}
                              updateOrderStatus={this.updateOrderStatus} updateOrderProducts={this.updateOrderProducts} remarkItems={this.remarkItems}/>
                    </Tab.Pane>
                    <Tab.Pane eventKey="fin">
                      <Orders orders={this.state.orders} products={this.state.products} status={'fin'}
                              updateOrderStatus={this.updateOrderStatus} updateOrderProducts={this.updateOrderProducts} remarkItems={this.remarkItems}/>
                    </Tab.Pane>
                    <Tab.Pane eventKey="cancel"> 
                      <Orders orders={this.state.orders} products={this.state.products} status={'cancel'}
                              updateOrderStatus={this.updateOrderStatus} updateOrderProducts={this.updateOrderProducts} remarkItems={this.remarkItems}/>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>

            </Panel.Body>
      </Panel>
    );
  }
}

export default App;
