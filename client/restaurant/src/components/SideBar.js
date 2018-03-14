import React, { Component } from 'react';

import {Row, Col, Nav, NavItem, ButtonToolbar, Button, Form, FormGroup, FormControl,
        ListGroup, ListGroupItem, Modal, Panel, ToggleButton, ToggleButtonGroup} from 'react-bootstrap';

class SideBar extends Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.changeRemark = this.changeRemark.bind(this);
    this.saveOrder = this.saveOrder.bind(this);
    this.isSavingOrder = false;

    this.state = {
      show: false,
      selectedProducts: {},
      selectedRemarkItems: []
    };
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow() {
    this.setState({ show: true });
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

  computeAmount() {
    let amount = 0;
    for(let productId in this.state.selectedProducts) {
      productId = parseInt(productId);
      const quantity = this.state.selectedProducts[productId];
      if (!quantity) continue;

      amount += quantity * this.props.products.filter(p => p.id === productId)[0].price;
    }
    return amount;
  }

  computeProducts() {
    let products = [];
    for(let productId in this.state.selectedProducts) {
      const quantity = this.state.selectedProducts[productId];
      if (!quantity) continue;

      products.push({product_id: productId, quantity: quantity});
    }
    return products;
  }

  saveOrder() {
    if (!this.hasSelectedProduct() || this.isSavingOrder) return;

    this.isSavingOrder = true;
    fetch('http://localhost:5000/api/order', {
      method: 'post',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        orderno: this.createOrderno(),
        amount: this.computeAmount(),
        remark: this.state.selectedRemarkItems.filter(i => i).join('|'),
        status: 'unpaid',
        products: this.computeProducts()
      })
    })
    .then(
      (res) => {
        this.setState({selectedProducts: {}});
        this.handleClose();
        this.isSavingOrder = false;
        this.props.updateOrder();
      },
      (error) => {
        this.setState({
          isLoaded: true,
          error
        });
      }
    );
  }

  render() {
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

    return (
        <div>
                <Nav bsStyle="pills" stacked>
                    <NavItem eventKey="unpaid">未支付</NavItem>
                    <NavItem eventKey="paid">已支付</NavItem>
                    <NavItem eventKey="fin">已完成</NavItem>
                    <NavItem eventKey="cancel">已取消</NavItem>
                  </Nav>

                <ButtonToolbar>
                  <Button bsStyle="primary" bsSize="large" block onClick={this.handleShow}>点餐</Button>
                </ButtonToolbar>

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


export default SideBar;
