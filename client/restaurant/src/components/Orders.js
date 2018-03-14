import React, { Component } from 'react';

import {Row, Col, Grid, ButtonToolbar, Button,
        Modal, ListGroup, ListGroupItem, 
        Form, FormGroup, FormControl,
        OverlayTrigger, Tooltip,
        Panel, ToggleButtonGroup, ToggleButton} from 'react-bootstrap';

class Orders extends Component {

  constructor(props) {
    super(props);
    this.getTimeAgo = this.getTimeAgo.bind(this);
    this.updateOrderStatus = this.updateOrderStatus.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.openAddProduct = this.openAddProduct.bind(this);
    this.changeRemark = this.changeRemark.bind(this);
    this.getRemarkValue = this.getRemarkValue.bind(this);
    this.saveOrder = this.saveOrder.bind(this);

    this.isSavingOrder = false;

    this.addProductToOrderId = 0;
    // XXX: is edit product
    this.reduceProductToOrderId = 0;

    this.state = {
      show: false,
      selectedProducts: {},
      selectedRemarkItems: []
    };
  }

  getTimeAgo(datetime) {
    const time = new Date(datetime);
    time.setHours(time.getHours() + 8);
    const now = new Date();
    const minute = Math.floor((now.valueOf() - time.valueOf())/(60*1000));
    
    if (minute > 60 * 24) {
      return Math.ceil(minute/(60 * 24)) + '天前'
    } else if (minute > 60) {
      return Math.ceil(minute/60) + '小时前'
    } else { 
      return minute + '分钟前';
    }
  }

  openAddProduct(evt, orderId) {
    this.addProductToOrderId = orderId;
    this.handleShow();
  }
  
  openReduceProduct(evt, orderId) {
    this.reduceProductToOrderId = orderId;
    const order = this.props.orders.filter(o => o.id === this.reduceProductToOrderId)[0];
    const orderProducts = order.products;
    let selectedProducts = orderProducts.reduce((acc, op) => {
      acc[op.product_id] = op.quantity;
      return acc;
    }, {});
    this.setState({selectedProducts});

    this.handleShow();
  }

  updateOrderStatus(evt, orderId, status) {
    if (status === 'cancel' && !window.confirm('确定取消吗？')) {
      return false;
    }

    fetch('http://localhost:5000/api/order/' + orderId, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        status: status,
      })
    })
    .then(
      (res) => {
        this.props.updateOrderStatus(orderId, status);
      },
      (error) => {
      }
    );
  }

  getOrders(status) {
    return this.props.orders
      .filter(({status}) => status === this.props.status)
      .map(order => {
        order.products = order.products.map(({id, product_id, quantity}) => {
          // XXX: this will change this.props.orders!!!
          return {...this.props.products.filter(p => product_id === p.id)[0], id, product_id, quantity};
        });
        return order;
      });
  }


  // TODO: merge with SiderBar.js
  ////////////////////////////////////////////////////
  handleClose() {
    this.addProductToOrderId = 0;
    this.reduceProductToOrderId = 0;
    this.setState({ show: false, selectedProducts: {}, selectedRemarkItems: [] });
  }

  handleShow() {
    const orderId = this.addProductToOrderId || this.reduceProductToOrderId;
    const order = this.props.orders.filter(o => o.id === orderId)[0];
    this.setState({ show: true, selectedRemarkItems: order.remark.split('|') });
  }

  toggleProduct(productId) {
    // copy
    let selectedProducts = {...this.state.selectedProducts};
    if (!selectedProducts[productId]) {
      selectedProducts[productId] = 1;
    } else {
      selectedProducts[productId] = 0;
    }

    this.setState({selectedProducts: selectedProducts});
  }

  addProduct(evt, productId) {
    // copy
    let selectedProducts = {...this.state.selectedProducts};
    if (!selectedProducts[productId]) selectedProducts[productId] = 0;
    selectedProducts[productId]++;

    this.setState({selectedProducts: selectedProducts});
    evt.stopPropagation();
  }
  
  reduceProduct(evt, productId) {
    // copy
    let selectedProducts = {...this.state.selectedProducts};
    if (!selectedProducts[productId] || selectedProducts[productId] === 0) {
      return;
    }

    selectedProducts[productId]--;

    this.setState({selectedProducts: selectedProducts});
    evt.stopPropagation();
  }

  changeRemark(idx, item) {
    let selectedRemarkItems = this.state.selectedRemarkItems.map(g => g);
    selectedRemarkItems[idx] = item;
    this.setState({selectedRemarkItems});
  }

  getRemarkValue(group) {
    const orderId = this.addProductToOrderId || this.reduceProductToOrderId;
    const order = this.props.orders.filter(o => o.id === orderId)[0];
    if (!order || !order.remark) return '';

    const items = order.remark.split('|');
    if (items.some(r => group.some(i => i === r))) {
      return items.filter(r => group.some(i => i === r))[0];
    } else {
      return '';
    }
  }

  createOrderno() {
    return new Date().valueOf();
  }

  hasSelectedProduct() {
    for(let productId in this.state.selectedProducts) {
      const quantity = this.state.selectedProducts[productId];
      if (quantity) return true;
    }
    return false;
  }

  /////////////////////////////////////////////////////

  saveOrder() {
    if (!this.hasSelectedProduct() || this.isSavingOrder) return;

    this.isSavingOrder = true;

    const remark = this.state.selectedRemarkItems.filter(r => r).join('|');

    if (this.addProductToOrderId) {
      let products = [];
      let selectedProductsId = [];
      const order = this.props.orders.filter(o => o.id === this.addProductToOrderId)[0];
      const orderProducts = order.products;
      let amount = order.amount;

      for(let productId in this.state.selectedProducts) {
        productId = parseInt(productId);
        const quantity = this.state.selectedProducts[productId];
        if (!quantity) continue;
        selectedProductsId.push(productId);
      }

      selectedProductsId.filter(productId => orderProducts.some(op => op.product_id === productId))
        .forEach(productId => {
          const quantity = this.state.selectedProducts[productId]; 
          amount += quantity * this.props.products.filter(p => p.id === productId)[0].price;
          const op = orderProducts.filter(op => op.product_id === productId)[0];
          products.push({id: op.id, quantity: op.quantity + quantity});
        });

      selectedProductsId.filter(productId => !orderProducts.some(op => op.product_id === productId))
        .forEach(productId => {
          const quantity = this.state.selectedProducts[productId]; 
          amount += quantity * this.props.products.filter(p => p.id === productId)[0].price;
          products.push({order_id: this.addProductToOrderId, product_id: productId, quantity: quantity});
        });

      orderProducts.filter(op => !selectedProductsId.some(productId => productId === op.product_id))
        .forEach(({id, quantity, product_id}) => {
          products.push({id, quantity, product_id, order_id: this.addProductToOrderId});
        });

      fetch('http://localhost:5000/api/order/' + this.addProductToOrderId, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          remark,
          amount,
          products
        })
      })
        .then(
          (res) => {
            this.setState({selectedProducts: []});
            this.props.updateOrderProducts(this.addProductToOrderId);
            this.handleClose();
            this.isSavingOrder = false;
          },
          (error) => {
          }
        );
    } else if (this.reduceProductToOrderId) {
      let products = [];
      let selectedProductsId = [];
      const order = this.props.orders.filter(o => o.id === this.reduceProductToOrderId)[0];
      const orderProducts = order.products;
      let amount = 0;

      for(let productId in this.state.selectedProducts) {
        productId = parseInt(productId);
        const quantity = this.state.selectedProducts[productId];
        if (!quantity) continue;
        selectedProductsId.push(productId);
      }

      selectedProductsId.filter(productId => orderProducts.some(op => op.product_id === productId))
        .forEach(productId => {
          const quantity = this.state.selectedProducts[productId]; 
          const op = orderProducts.filter(op => op.product_id === productId)[0];
          amount += quantity * this.props.products.filter(p => p.id === productId)[0].price;
          products.push({id: op.id, quantity: quantity});
        });

      selectedProductsId.filter(productId => !orderProducts.some(op => op.product_id === productId))
        .forEach(productId => {
          const quantity = this.state.selectedProducts[productId]; 
          amount += quantity * this.props.products.filter(p => p.id === productId)[0].price;
          products.push({order_id: this.reduceProductToOrderId, product_id: productId, quantity: quantity});
        });

      orderProducts.filter(op => !selectedProductsId.some(productId => productId === op.product_id))
        .forEach(({id, quantity, product_id}) => {
          amount += quantity * this.props.products.filter(p => p.id === product_id)[0].price;
          products.push({id, quantity, product_id, order_id: this.reduceProductToOrderId});
        });

      fetch('http://localhost:5000/api/order/' + this.reduceProductToOrderId, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          remark,
          amount,
          products
        })
      })
        .then(
          (res) => {
            let products = [];
            orderProducts.filter(op => !selectedProductsId.some(productId => productId === op.product_id))
              .forEach(({id, quantity, product_id}) => {
                amount -= quantity * this.props.products.filter(p => p.id === product_id)[0].price;
                products.push({id});
              });

            return fetch('http://localhost:5000/api/order/' + this.reduceProductToOrderId, {
              method: 'PATCH',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                amount,
                products: {
                  remove: products
                }
              })
            })
          },
          (error) => {
          }
        )
        .then(
          (res) => {
            this.setState({selectedProducts: []});
            this.props.updateOrderProducts(this.reduceProductToOrderId);
            this.handleClose();
            this.isSavingOrder = false;
          },
          (error) => {
          }
        );
    } else {
      this.isSavingOrder = false;
    }
  }

  render() {
    const orders = this.getOrders(this.props.status);
    const productsList = this.props.products.map(p => (
            <ListGroupItem onClick={(evt) => this.toggleProduct(p.id)} 
                           active={this.state.selectedProducts[p.id]}>
            <Form horizontal>
                <FormGroup controlId="formBasicText" >
                <Col sm={7}>
                {p.name}
                </Col>

                <Col sm={2}>
                  <FormControl
                    type="number"
                    value={this.state.selectedProducts[p.id] || 0}
                    bsSize="sm"
                  />
                </Col>

                <Col sm={2}>
                <ButtonToolbar>
                  <Button bsStyle="success" bsSize="large" block 
                         onClick={(evt) => this.addProduct(evt, p.id)}>+</Button>
                </ButtonToolbar>
                </Col>
      
                <Col sm={1}>
                <ButtonToolbar bsClass={!this.state.selectedProducts[p.id] ? 'hide' : ''}>
                  <Button bsStyle="info" bsSize="large" block 
                         onClick={(evt) => this.reduceProduct(evt, p.id)}>-</Button>
                </ButtonToolbar>
                </Col>
                </FormGroup>
            </Form>
            </ListGroupItem>
        ));

    // console.log(this.props.products);
    return (
      <div>
        <Grid bsClass="orders">
      {orders
        .reduce((pairs, order, idx) => {
          if(idx % 3 === 0) {
            pairs.push([]);
          }
          pairs[pairs.length - 1].push(order);
          return pairs;
        }, [])
        .map((pair, idx) => {
          return (
            <Row className="show-grid">
            {
              pair.map((order, idx) => (
                <Col xs={4} md={4}>
                <OverlayTrigger placement="top" overlay={(
                  <Tooltip id="tooltip">
                  <div>
                  <div className="tooltip-products">
                    {order.products.map(({name, quantity}) => (
                      <div>{name} ({quantity})</div>
                    ))}
                    </div>
                    <div>
                    {order.remark.split('|').map(r => (
                      <div className="tooltip-remark">{r}</div> 
                    ))}
                    </div>
                  </div>
                  </Tooltip>
                )}>
                  <Row>
                    <Col xs={5}>
                    <div className="amount"><span className="number">{order.amount}</span>元 {this.getTimeAgo(order.created_at)}</div>
                    {order.products.map(({name, quantity}) => (
                      <div>{name} ({quantity})</div>
                    ))}
                    </Col>

                    <Col xs={4}>
                      <Button bsStyle="success" bsSize="large" block className={order.status !== 'unpaid' ? 'hide' : ''}
                                   onClick={(evt) => this.updateOrderStatus(evt, order.id, 'paid')}>支付</Button>
                      <Button bsStyle="success" bsSize="large" block className={order.status !== 'paid' ? 'hide' : ''}
                             onClick={(evt) => this.updateOrderStatus(evt, order.id, 'fin')}>完成</Button>
                      <Button bsStyle="info" bsSize="xsmall" block className={order.status !== 'unpaid' ? 'hide' : ''}
                             onClick={(evt) => this.updateOrderStatus(evt, order.id, 'cancel')}>取消</Button>
                    </Col>

                    <Col xs={3}>
                      <Button bsStyle="info" bsSize="large" block className={order.status === 'cancel' || order.status === 'unpaid' ? 'hide' : ''} 
                             onClick={(evt) => this.openAddProduct(evt, order.id)}>+</Button>
                      <Button bsStyle="info" bsSize="large" block className={order.status !== 'unpaid' ? 'hide' : ''}
                             onClick={(evt) => this.openReduceProduct(evt, order.id)}>+/-</Button>
                    </Col>
                  </Row>
                </OverlayTrigger>
                </Col>
              ))
            }
            </Row> 
          );
        })}
        </Grid>

      <Modal show={this.state.show} onHide={this.handleClose} bsSize="lg">
              <Modal.Body>
              <Row>
              <Col sm={8}>
                 <ListGroup>
                      {productsList}
                 </ListGroup> 
              </Col>
              <Col sm={4}>
                <div>备注：</div>
                <Panel>
                  <Panel.Body>
                  <ButtonToolbar>
                    {this.props.remarkItems.map((group, idx) => (
                      <ToggleButtonGroup type="radio" name="options"
                                         defaultValue={this.getRemarkValue(group)}
                                         onChange={(item) => this.changeRemark(idx, item)}>
                        {group.map(item => (
                          <ToggleButton value={item}>{item}</ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    ))}
                  </ButtonToolbar>
                  </Panel.Body>
                </Panel>
              </Col>
              </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.handleClose}>Close</Button>
                <Button onClick={this.saveOrder} bsStyle="primary">Save changes</Button>
              </Modal.Footer>
            </Modal>
      </div>
    );
  }
}

export default Orders;
