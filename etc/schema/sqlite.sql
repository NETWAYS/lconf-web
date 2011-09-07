/*****************************************************/
/* Auto generated mysql SQL Schema file for icinga-web*/
/* Creation date: 2011-02-01T16:40:23+01:00          */
/****************************************************/


/*           SQL schema defintiion        */
CREATE TABLE nsm_db_version (vers_id INTEGER, version INT, PRIMARY KEY (vers_id));

CREATE TABLE nsm_log (
	log_id INTEGER PRIMARY KEY AUTOINCREMENT ,
	log_level INTEGER NOT NULL, 
	log_message TEXT NOT NULL, 
	log_created DATETIME NOT NULL, 
	log_modified DATETIME NOT NULL);

CREATE TABLE nsm_principal (
	principal_id INTEGER PRIMARY KEY ,
	principal_user_id INTEGER, 
	principal_role_id INTEGER, 
	principal_type, 
	principal_disabled INTEGER DEFAULT '0', 
	FOREIGN KEY (principal_user_id) REFERENCES nsm_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE, 
	FOREIGN KEY (principal_role_id) REFERENCES nsm_role(role_id) ON UPDATE CASCADE ON DELETE CASCADE);

CREATE TABLE nsm_principal_target (
	pt_id INTEGER PRIMARY KEY AUTOINCREMENT , 
	pt_principal_id INTEGER NOT NULL, 
	pt_target_id INTEGER NOT NULL,
	FOREIGN KEY (pt_target_id) REFERENCES nsm_target(target_id) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (pt_principal_id) REFERENCES nsm_principal(principal_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE nsm_role (
	role_id INTEGER PRIMARY KEY AUTOINCREMENT , 
	role_name VARCHAR(40) NOT NULL,
	role_description VARCHAR(255),
	role_disabled INTEGER DEFAULT '0' NOT NULL, 
	role_created DATETIME NOT NULL, 
	role_modified DATETIME NOT NULL, 
	role_parent INTEGER, 
	FOREIGN KEY (role_parent) REFERENCES nsm_role(role_id)
);

CREATE TABLE nsm_session (
	session_entry_id INTEGER PRIMARY KEY AUTOINCREMENT , 
	session_id VARCHAR(255) NOT NULL, 
	session_name VARCHAR(255) NOT NULL, 
	session_data LONGTEXT NOT NULL, 
	session_checksum VARCHAR(255) NOT NULL, 
	session_created DATETIME NOT NULL, 
	session_modified DATETIME NOT NULL);

CREATE TABLE nsm_target (
	target_id INTEGER PRIMARY KEY AUTOINCREMENT , 
	target_name VARCHAR(45) NOT NULL, 
	target_description VARCHAR(100), 
	target_class VARCHAR(80), 
	target_type VARCHAR(45) NOT NULL);

CREATE TABLE nsm_target_value (
	tv_pt_id INTEGER PRIMARY KEY AUTOINCREMENT , 
	tv_key VARCHAR(45), 
	tv_val VARCHAR(45) NOT NULL, 
	FOREIGN KEY (tv_pt_id) REFERENCES nsm_principal_target(pt_id) ON UPDATE CASCADE ON DELETE CASCADE);

CREATE TABLE nsm_user (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_account INTEGER DEFAULT 0 NOT NULL, 
	user_name VARCHAR(127) NOT NULL, 
	user_lastname VARCHAR(40) NOT NULL, 
	user_firstname VARCHAR(40) NOT NULL, 
	user_password VARCHAR(64) NOT NULL, 
	user_salt VARCHAR(64) NOT NULL, 
	user_authsrc VARCHAR(45) DEFAULT 'internal' NOT NULL, 
	user_authid VARCHAR(127), 
	user_authkey VARCHAR(64), 
	user_email VARCHAR(40) NOT NULL, 
	user_disabled INTEGER DEFAULT '1' NOT NULL, 
	user_created DATETIME NOT NULL, 
	user_modified DATETIME NOT NULL);

CREATE TABLE nsm_user_preference (
	upref_id INTEGER PRIMARY KEY AUTOINCREMENT,
	upref_user_id INTEGER NOT NULL, 
	upref_val VARCHAR(100), 
	upref_longval LONGTEXT, 
	upref_key VARCHAR(50) NOT NULL, 
	upref_created DATETIME NOT NULL, 
	upref_modified DATETIME NOT NULL,
	FOREIGN KEY (upref_user_id) REFERENCES nsm_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE);

CREATE TABLE nsm_user_role (
	usro_user_id INTEGER, 
	usro_role_id INTEGER,
	FOREIGN KEY (usro_user_id) REFERENCES nsm_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (usro_role_id) REFERENCES nsm_role(role_id) ON UPDATE CASCADE ON DELETE CASCADE,
	PRIMARY KEY (usro_user_id, usro_role_id) 
);

/*          Initial data import              */
 
INSERT INTO nsm_db_version (vers_id,version) VALUES ('1','2');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('7','appkit.access','Access to login-page (which, actually, means no access)','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('8','lconf.user','Access to lconf','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('9','appkit.admin.groups','Access to group editor','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('10','appkit.admin.users','Access to user editor','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('11','appkit.admin','Access to admin panel ','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('12','appkit.user.dummy','Basic right for users','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('13','appkit.api.access','Access to web-based api adapter','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_class,target_type) VALUES ('14','icinga.demoMode','Hide features like password reset which are not wanted in demo systems','','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_type) VALUES ('15','lconf.user','Allow access to the lconf module','credential');
INSERT INTO nsm_target (target_id,target_name,target_description,target_type) VALUES ('16','lconf.admin','Allow administration of lconf module','credential');


INSERT INTO nsm_role (role_id,role_name,role_description,role_disabled,role_modified,role_created) VALUES ('1','lconf_user','The default representation of a lconf user','0',date('now'),date('now'));
INSERT INTO nsm_role (role_id,role_name,role_description,role_disabled,role_modified,role_created) VALUES ('2','appkit_user','Appkit user test','0',date('now'),date('now'));
INSERT INTO nsm_role (role_id,role_name,role_description,role_disabled,role_parent,role_modified,role_created) VALUES ('3','appkit_admin','AppKit admin','0','2',date('now'),date('now'));
INSERT INTO nsm_role (role_id,role_name,role_description,role_disabled,role_modified,role_created) VALUES ('4','guest','Unauthorized Guest','0',date('now'),date('now'));
INSERT INTO nsm_role (role_id,role_name,role_description,role_disabled,role_modified,role_created) VALUES ('5','lconf_admin', 'A LConf administrator','0',date('now'),date('now'));
INSERT INTO nsm_user (user_id,user_account,user_name,user_firstname,user_lastname,user_password,user_salt,user_authsrc,user_email,user_disabled,user_modified,user_created) VALUES ('1','0','root','Enoch','Root','42bc5093863dce8c150387a5bb7e3061cf3ea67d2cf1779671e1b0f435e953a1','0c099ae4627b144f3a7eaa763ba43b10fd5d1caa8738a98f11bb973bebc52ccd','internal','root@localhost.local','0',date('now'),date('now'));
INSERT INTO nsm_user_role (usro_user_id,usro_role_id) VALUES ('1','1');
INSERT INTO nsm_user_role (usro_user_id,usro_role_id) VALUES ('1','2');
INSERT INTO nsm_user_role (usro_user_id,usro_role_id) VALUES ('1','3');
INSERT INTO nsm_user_role (usro_user_id,usro_role_id) VALUES ('1','5');
INSERT INTO nsm_principal (principal_id,principal_user_id,principal_type,principal_disabled) VALUES ('1','1','user','0');
INSERT INTO nsm_principal (principal_id,principal_role_id,principal_type,principal_disabled) VALUES ('2','2','role','0');
INSERT INTO nsm_principal (principal_id,principal_role_id,principal_type,principal_disabled) VALUES ('3','3','role','0');
INSERT INTO nsm_principal (principal_id,principal_role_id,principal_type,principal_disabled) VALUES ('4','1','role','0');
INSERT INTO nsm_principal (principal_id,principal_role_id,principal_type,principal_disabled) VALUES ('5','4','role','0');
INSERT INTO nsm_principal (principal_id,principal_role_id,principal_type,principal_disabled) VALUES ('6','5','role','0');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('1','2','8');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('2','2','13');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('3','3','9');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('4','3','10');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('5','3','11');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('6','4','8');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('7','5','7');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('8','6','15');
INSERT INTO nsm_principal_target (pt_id,pt_principal_id,pt_target_id) VALUES ('9','6','16');



--- LConf specific tables ---


CREATE TABLE lconf_connection (
	connection_id INTEGER PRIMARY KEY AUTOINCREMENT, 
	connection_name VARCHAR(255), 
	connection_description VARCHAR(512), 
	owner INTEGER, 
	connection_binddn VARCHAR(512) NOT NULL, 
	connection_bindpass VARCHAR(512), 
	connection_host VARCHAR(512) NOT NULL DEFAULT 'localhost', 
	connection_port INTEGER NOT NULL DEFAULT 389,
        connection_basedn VARCHAR(512),
	connection_tls INTEGER DEFAULT 0,
	connection_ldaps INTEGER DEFAULT 0
);


CREATE TABLE lconf_filter (
	filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER DEFAULT '-1', 
	filter_name VARCHAR(255) NOT NULL, 
	filter_json VARCHAR(512) NOT NULL, 
	filter_isglobal INTEGER DEFAULT '0' NOT NULL
);

CREATE TABLE lconf_principal (
	principal_id INTEGER PRIMARY KEY AUTOINCREMENT, 
	principal_user_id INTEGER, 
	principal_role_id INTEGER, 
	connection_id INTEGER
);

INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (2,1,'ONLY Timeperiods','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Timeperiod\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (3,1,'ONLY Commands','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Command\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (4,1,'ONLY Contacts','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Contact\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (6,1,'ONLY Contactgroups','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Contactgroup\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (7,1,'ONLY Hosts','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Host\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (8,1,'ONLY Hostgroups','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Hostgroup\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (9,1,'ONLY Services','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Service\"}]}',1);
INSERT INTO lconf_filter (filter_id,user_id,filter_name,filter_json,filter_isglobal) VALUES (10,1,'ONLY Servicegroups','{\"AND\":[{\"filter_negated\":false,\"filter_attribute\":\"objectclass\",\"filter_type\":1,\"filter_value\":\"${schemaPrefix}Servicegroup\"}]}',1);
