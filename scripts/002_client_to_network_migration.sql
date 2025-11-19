-- Migration script to rename client references to network
-- Add Network table
CREATE TABLE IF NOT EXISTS networks (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  active_flag BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the network data provided by user
INSERT INTO networks (id, name) VALUES
('13', 'Lehigh Valley'),
('16', 'Willis Knighton'),
('18', 'Baptist Arkansas'),
('19', 'UofL'),
('21', 'Parrish Medical Center'),
('29', 'Arkansas Childrens')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP;

-- Update existing tables to use networkId instead of clientId
-- Note: In a real migration, you'd need to handle data transformation
-- This is a simplified version for demo purposes

-- Update time_entry_raw_ingest table
ALTER TABLE time_entry_raw_ingest 
RENAME COLUMN client_id TO network_id;

-- Update time_entry_records table  
ALTER TABLE time_entry_records 
RENAME COLUMN client_id TO network_id;

ALTER TABLE time_entry_records 
RENAME COLUMN employee_client_id TO employee_network_id;

-- Update employee_crosswalk table
ALTER TABLE employee_crosswalk 
RENAME COLUMN client_id TO network_id;

ALTER TABLE employee_crosswalk 
RENAME COLUMN client_employee_id TO network_employee_id;

-- Update client_mappings to network_mappings
ALTER TABLE client_mappings 
RENAME TO network_mappings;

ALTER TABLE network_mappings 
RENAME COLUMN client_id TO network_id;

-- Update incentive_catalog table
ALTER TABLE incentive_catalog 
RENAME COLUMN client_id TO network_id;
