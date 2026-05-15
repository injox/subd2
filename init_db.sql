CREATE TABLE IF NOT EXISTS roles(
	id SERIAL PRIMARY KEY,
	code TEXT,
	label TEXT
);

INSERT INTO roles(code,label) VALUES('admin', 'Администратор'),('manager', 'Руководитель'),('employee', 'Сотрудник');

CREATE TABLE IF NOT EXISTS users(
	id SERIAL PRIMARY KEY,
	login TEXT,
	pass TEXT,
	fio TEXT,
	id_role INT REFERENCES roles (id),
	is_blocked INT default 0
);

INSERT INTO users(login, pass,fio,id_role,is_blocked) VALUES
('admin', '098f6bcd4621d373cade4e832627b4f6', 'Тестовый Администратор', 1, 0),
('manager', '098f6bcd4621d373cade4e832627b4f6', 'Тестовый Руководитель', 2, 0),
('employee', '098f6bcd4621d373cade4e832627b4f6', 'Тестовый Сотрудник', 3, 0);

CREATE TABLE IF NOT EXISTS clients(
	id SERIAL PRIMARY KEY,
	label TEXT
);

INSERT INTO clients(label) VALUES('Тестовый клиент');

CREATE TABLE IF NOT EXISTS order_statuses(
	id SERIAL PRIMARY KEY,
	label TEXT
);

INSERT INTO order_statuses(id,label) VALUES
(10, 'Проект'),
(20, 'В работе'),
(30, 'Завершён');

CREATE TABLE IF NOT EXISTS orders(
	id SERIAL PRIMARY KEY,
	label TEXT,
	id_status INT NOT NULL DEFAULT 10,
	id_client INT REFERENCES clients(id),
	amount NUMERIC(20,2)
);

CREATE TABLE IF NOT EXISTS products(
	id SERIAL PRIMARY KEY,
	label TEXT,
	price NUMERIC(20,2)
);

INSERT INTO products(label, price) VALUES
('Товар A', 100.00),
('Товар B', 250.00),
('Товар C', 75.50);

CREATE TABLE IF NOT EXISTS order_items(
	id SERIAL PRIMARY KEY,
	label TEXT,
	product_id INT REFERENCES products(id),
	id_order INT REFERENCES orders(id),
	amount NUMERIC(20,2)
);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_id INT REFERENCES products(id);

CREATE TABLE IF NOT EXISTS payment_types(
	id SERIAL PRIMARY KEY,
	label TEXT
);

INSERT INTO payment_types(id, label) VALUES
(10, 'Аванс'),
(20, 'Основной');

CREATE TABLE IF NOT EXISTS payments(
	id SERIAL PRIMARY KEY,
	id_order INT,
	id_payment_type INT REFERENCES payment_types(id),
	amount NUMERIC(20,2)
);