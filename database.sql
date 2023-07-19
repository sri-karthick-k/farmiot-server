CREATE TABLE user_details (uid SERIAL PRIMARY KEY, name VARCHAR(30), password VARCHAR(30), address VARCHAR(50), mobile VARCHAR(10), email varchar(40));

CREATE TABLE user_role_management(rid SERIAL, uid INT , ADMIN_ID INT, ROLE VARCHAR(10),FOREIGN KEY (UID) REFERENCES user_details (uid), FOREIGN KEY (admin_id) REFERENCES user_details (uid), primary key (rid, uid));

CREATE TABLE device (device_id SERIAL, LOGITUDE VARCHAR(20), LATITUDE VARCHAR(20), DESCRIPTION VARCHAR(50), PRIMARY KEY (device_id));

CREATE TABLE DEVICE_MANAGEMENT(UID INT, DEVICE_ID SERIAL, ACCESS BOOLEAN, FOREIGN KEY (UID) REFERENCES user_details (uid), FOREIGN KEY (device_id) REFERENCES device (device_id));

DROP TABLE IF EXISTS SENSOR_PARAMETERS;
CREATE TABLE SENSOR_PARAMETERS(SENSOR_ID SERIAL, DEVICE_ID int, KEY VARCHAR(40), MINVALUE INT, MAXVALUE INT, SIUNIT VARCHAR(5), FOREIGN KEY (DEVICE_ID) REFERENCES DEVICE (DEVICE_ID), PRIMARY KEY (SENSOR_ID));

CREATE TABLE SENSOR_VALUE(ID SERIAL, SENSOR_ID INT, VALUE INT, U_TIME timestamp, FOREIGN KEY (SENSOR_ID) REFERENCES SENSOR_PARAMETERS (SENSOR_ID));

ALTER TABLE user_details ALTER COLUMN mobile TYPE VARCHAR(10);