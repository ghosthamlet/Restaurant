# -*- encoding: utf8 -*-

# https://jeffknupp.com/blog/2014/05/06/automatically-generate-restful-endpoints-from-your-flasksqlalchemy-models/
# https://github.com/jeffknupp/sandman2
# https://github.com/jfinkels/flask-restless
# https://github.com/RobusGauli/flask-restapi-gen
# https://github.com/mevdschee/php-crud-api 

import flask
import flask.ext.sqlalchemy
import flask.ext.restless
from flask_cors import CORS

from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from werkzeug.exceptions import HTTPException
from flask_basicauth import BasicAuth

from sqlalchemy.sql import func

# Create the Flask application and the Flask-SQLAlchemy object.
app = flask.Flask(__name__, template_folder="template")
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'
CORS(app)

app.config['DEBUG'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///E:\\code\\restaurant\\db\\restaurant.db'
# for admin
app.config['BASIC_AUTH_USERNAME'] = 'admin'
app.config['BASIC_AUTH_PASSWORD'] = 'i'

db = flask.ext.sqlalchemy.SQLAlchemy(app)

# Create your Flask-SQLALchemy models as usual but with the following two
# (reasonable) restrictions:
#   1. They must have a primary key column of type sqlalchemy.Integer or
#      type sqlalchemy.Unicode.
#   2. They must have an __init__ method which accepts keyword arguments for
#      all columns (the constructor in flask.ext.sqlalchemy.SQLAlchemy.Model
#      supplies such a method, so you don't need to declare a new one).
# class Person(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.Unicode, unique=True)
#     birth_date = db.Column(db.Date)
# 
# 
# class Computer(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.Unicode, unique=True)
#     vendor = db.Column(db.Unicode)
#     purchase_time = db.Column(db.DateTime)
#     owner_id = db.Column(db.Integer, db.ForeignKey('person.id'))
#     owner = db.relationship('Person', backref=db.backref('computers',
#                                                          lazy='dynamic'))

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, onupdate=func.now())
    deleted_at = db.Column(db.DateTime)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    orderno = db.Column(db.Unicode(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.Unicode(50), nullable=False)
    remark = db.Column(db.Unicode(50), nullable=False, server_default='')
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, onupdate=func.now())
    deleted_at = db.Column(db.DateTime)
    products = db.relationship('OrderProduct',
                                backref=db.backref('order'))

class OrderProduct(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    # order = db.relationship('Order', backref=db.backref('products', lazy='dynamic'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product = db.relationship('Product', backref=db.backref('order_products', lazy='dynamic'))
    quantity = db.Column(db.Integer, nullable=False, server_default='1')
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, onupdate=func.now())


# Create the database tables.
db.create_all()

# Create the Flask-Restless API manager.
manager = flask.ext.restless.APIManager(app, flask_sqlalchemy_db=db)

# Create API endpoints, which will be available at /api/<tablename> by
# default. Allowed HTTP methods can be specified as well.
manager.create_api(Order, methods=['GET', 'POST', 'PATCH'], results_per_page=600, max_results_per_page=600,
        exclude_columns=['products.order_id', 'products.created_at', 'products.updated_at'])
manager.create_api(Product, methods=['GET', 'POST', 'PATCH'], results_per_page=600, max_results_per_page=600,
        exclude_columns=['order_products'])

basic_auth = BasicAuth(app)

class MyModelView(ModelView):
    can_delete = False 
    form_excluded_columns = ['order_products', 'products']
    
    def is_accessible(self):
        if not basic_auth.authenticate():
            raise AuthException('Not authenticated.')
        else:
            return True

    def inaccessible_callback(self, name, **kwargs):
        return redirect(basic_auth.challenge())

class AuthException(HTTPException):
    def __init__(self, message):
        super(AuthException, self).__init__(message, flask.Response(
            "You could not be authenticated. Please refresh the page.", 401,
            {'WWW-Authenticate': 'Basic realm="Login Required"'}
        ))

admin = Admin(app, name='Restaurant', template_mode='bootstrap3')
admin.add_view(MyModelView(Product, db.session))
admin.add_view(MyModelView(Order, db.session))

if __name__ == '__main__':
    # start the flask loop
    app.run(host='localhost', port=8000)

