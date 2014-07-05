CREATE DATABASE IF NOT EXISTS Netshade;

USE Netshade;

CREATE TABLE IF NOT EXISTS Ns_Users (
        uuid VARCHAR (36) NOT NULL
      , Firstname VARCHAR (255) NOT NULL
      , Lastname VARCHAR (255) NOT NULL
      , Username VARCHAR (50) NOT NULL
      , Password VARCHAR (50) NOT NULL
    );

CREATE TABLE IF NOT EXISTS Ns_Servers (
        uuid VARCHAR (36) NOT NULL
      , Address VARCHAR (255) NOT NULL
      , Username VARCHAR (255) NOT NULL
      , Password VARCHAR (255) NOT NULL
      , UserKey VARCHAR (36) NOT NULL
    );

CREATE TABLE IF NOT EXISTS Ns_Search (
        uuid VARCHAR (36) NOT NULL 
      , GroupKey VARCHAR (255) NOT NULL
      , Parameter VARCHAR (50) NOT NULL
    );

CREATE TABLE IF NOT EXISTS Ns_Group (
        uuid VARCHAR (36) NOT NULL
      , Serverkey VARCHAR (36) NOT NULL 
      , Address VARCHAR (255) NOT NULL 
      , Startat BIGINT (11) NULL 
      , Endat BIGINT (11) NULL 
      , Countof BIGINT (11) NULL 
      , PRIMARY KEY (uuid)
    );

CREATE TABLE IF NOT EXISTS Ns_Bookmark (
        UserKey VARCHAR (36) NOT NULL
      , Articlekey VARCHAR (36) NOT NULL 
    );

CREATE TABLE IF NOT EXISTS Ns_Queue (
        id MEDIUMINT NOT NULL AUTO_INCREMENT,
        uuid VARCHAR (36) NOT NULL
      , message TEXT NOT NULL 
      , PRIMARY KEY (id)
    );

CREATE TABLE IF NOT EXISTS Ns_Subscription (
        UserKey VARCHAR (36) NOT NULL
      , Groupkey VARCHAR (36) NOT NULL 
    );

CREATE TABLE IF NOT EXISTS Ns_Articleset (
        uuid VARCHAR (36) NOT NULL
      , group_uuid VARCHAR (36) NOT NULL
      , parent_uuid VARCHAR (36) NULL
      , ArticleIndex INT (4) NOT NULL 
      , message_id BIGINT (11) NOT NULL 
      , message_key TEXT NOT NULL 
      , message_type VARCHAR (11) NULL 
      , message_ref VARCHAR (255) NULL 
      , message_date VARCHAR (25) NULL 
      , sender_name VARCHAR (255) NULL 
      , sender_email VARCHAR (255) NULL 
      , subject VARCHAR (255) NOT NULL 
      , children INT (4) NULL 
      , PRIMARY KEY (uuid)
    ); 

CREATE TABLE IF NOT EXISTS Ns_Articledata (
        uuid VARCHAR (36) NOT NULL
      , data LONGTEXT NOT NULL
      , thumb MEDIUMTEXT NULL
      , filename VARCHAR (255) NULL 
      , PRIMARY KEY (uuid) 
    );

CREATE TABLE IF NOT EXISTS Ns_Articlerar (
        uuid VARCHAR (36) NOT NULL
      , source_uuid VARCHAR (36) NULL
      , parent_uuid VARCHAR (36) NULL
      , filename VARCHAR (255) NULL 
      , filetype VARCHAR (50) NULL 
      , data LONGTEXT NOT NULL
      , thumb MEDIUMTEXT NULL
      , PRIMARY KEY (uuid) 
    );

DELETE FROM Ns_Users;
DELETE FROM Ns_Servers;
-- DELETE FROM Ns_Group;

INSERT INTO Ns_Users (
        uuid
      , Firstname
      , Lastname
      , Username
      , Password
    ) VALUES (
        '5b619c93-f109-4592-8bc7-269fc2b665c5'
      , 'Milton'
      , 'Jones'
      , 'uriah280'
      , 'arora'
    );

INSERT INTO Ns_Users (
        uuid
      , Firstname
      , Lastname
      , Username
      , Password
    ) VALUES (
        '12345c93-f109-4592-8bc7-269fc2b665c5'
      , 'Milton'
      , 'Jones'
      , 'uriah'
      , 'arora'
    );


INSERT INTO Ns_Servers (
        uuid
      , Address 
      , Username
      , Password
      , UserKey
    ) VALUES (
        'a9d420f4-070c-4b7c-a933-6f8dacf4d5b3'
      , 'news.usenet.net'
      , 'info@cyber8.net'
      , 'Password1$'
      , '5b619c93-f109-4592-8bc7-269fc2b665c5'
    );

INSERT INTO Ns_Servers (
        uuid
      , Address 
      , Username
      , Password
      , UserKey
    ) VALUES (
        '123450f4-070c-4b7c-a933-6f8dacf4d5b3'
      , 'east.AltBinaries.com'
      , 'a23242'
      , '2827718'
      ,  '12345c93-f109-4592-8bc7-269fc2b665c5'
    );




INSERT INTO Ns_Users (
        uuid
      , Firstname
      , Lastname
      , Username
      , Password
    ) VALUES (
        '64789c93-f109-4592-8bc7-269fc2b665c5'
      , 'Milton'
      , 'Jones'
      , 'milton'
      , 'arora'
    );


INSERT INTO Ns_Servers (
        uuid
      , Address 
      , Username
      , Password
      , UserKey
    ) VALUES (
        '647895f4-070c-4b7c-a933-6f8dacf4d5b3'
      , 'news.giganews.com'
      , 'uriah280'
      , 'active'
      , '64789c93-f109-4592-8bc7-269fc2b665c5'
    );


