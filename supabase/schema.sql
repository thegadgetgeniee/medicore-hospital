-- ============================================================
-- MEDICORE HOSPITAL - SUPABASE DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'doctor', 'pharmacist', 'receptionist', 'nurse')),
  avatar_url TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT,
  registration_no TEXT,
  fee NUMERIC(10,2) NOT NULL DEFAULT 500,
  phone TEXT,
  email TEXT,
  schedule TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  email TEXT,
  salary NUMERIC(10,2),
  join_date DATE,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uhid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT NOT NULL,
  email TEXT,
  blood_group TEXT,
  address TEXT,
  allergies TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate UHID
CREATE SEQUENCE IF NOT EXISTS uhid_seq START 1;
CREATE OR REPLACE FUNCTION generate_uhid()
RETURNS TRIGGER AS $$
BEGIN
  NEW.uhid := 'UHID' || LPAD(nextval('uhid_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_uhid
  BEFORE INSERT ON patients
  FOR EACH ROW
  WHEN (NEW.uhid IS NULL OR NEW.uhid = '')
  EXECUTE FUNCTION generate_uhid();

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  type TEXT DEFAULT 'Consultation',
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','In Progress','Completed','Cancelled')),
  token INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-assign daily token
CREATE OR REPLACE FUNCTION assign_token()
RETURNS TRIGGER AS $$
DECLARE
  max_token INTEGER;
BEGIN
  SELECT COALESCE(MAX(token), 0) INTO max_token
  FROM appointments
  WHERE date = NEW.date;
  NEW.token := max_token + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_token
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION assign_token();

-- ============================================================
-- VISITS (OPD encounters)
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID REFERENCES doctors(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint TEXT,
  vitals JSONB DEFAULT '{}',
  diagnosis TEXT,
  prescription JSONB DEFAULT '[]',
  notes TEXT,
  follow_up DATE,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  billing_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'OPD',
  price NUMERIC(10,2) NOT NULL,
  gst_percent NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  service_ids UUID[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OPD BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS opd_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  visit_id UUID REFERENCES visits(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]',
  sub_total NUMERIC(10,2) DEFAULT 0,
  gst_total NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEDICINES (Pharmacy Inventory)
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT DEFAULT 'Other',
  hsn_code TEXT,
  mrp NUMERIC(10,2) NOT NULL,
  purchase_price NUMERIC(10,2),
  gst_percent NUMERIC(5,2) DEFAULT 12,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Strip',
  expiry_date TEXT,
  manufacturer TEXT,
  location TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHARMACY ORDERS (from OPD prescriptions)
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES visits(id),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Billed','Processed','Cancelled')),
  bill_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHARMACY BILLS (GST Sales)
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacy_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  order_id UUID REFERENCES pharmacy_orders(id),
  patient_name TEXT,
  doctor_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]',
  sub_total NUMERIC(10,2) DEFAULT 0,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  gst_breakdown JSONB DEFAULT '{}',
  discount NUMERIC(10,2) DEFAULT 0,
  grand_total NUMERIC(10,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_bills ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read/write (hospital staff)
CREATE POLICY "Authenticated users full access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON doctors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON opd_bills FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON medicines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON pharmacy_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON pharmacy_bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO doctors (name, specialization, qualification, registration_no, fee, phone, schedule, available) VALUES
  ('Dr. Priya Sharma', 'General Physician', 'MBBS, MD', 'AP-MCI-12345', 500, '9876543210', 'Mon-Sat 9AM-5PM', true),
  ('Dr. Ravi Kumar', 'Cardiologist', 'MBBS, DM Cardiology', 'AP-MCI-12346', 1000, '9876543211', 'Mon-Fri 10AM-4PM', true),
  ('Dr. Anjali Reddy', 'Dermatologist', 'MBBS, MD Dermatology', 'AP-MCI-12347', 700, '9876543212', 'Tue-Sat 11AM-6PM', true)
ON CONFLICT DO NOTHING;

INSERT INTO staff (name, role, department, phone, salary, join_date, active) VALUES
  ('Lakshmi Devi', 'Nurse', 'OPD', '9876500001', 25000, '2023-01-15', true),
  ('Suresh Babu', 'Receptionist', 'Front Desk', '9876500002', 18000, '2023-03-01', true),
  ('Ramesh K', 'Pharmacist', 'Pharmacy', '9876500003', 22000, '2022-11-10', true)
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category, price, gst_percent) VALUES
  ('Consultation', 'OPD', 500, 0),
  ('ECG', 'Diagnostics', 300, 18),
  ('Blood Test - CBC', 'Lab', 250, 18),
  ('X-Ray Chest', 'Radiology', 400, 18),
  ('Dressing', 'Procedure', 150, 5),
  ('Injection (IM)', 'Procedure', 80, 5)
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, brand, category, hsn_code, mrp, purchase_price, gst_percent, stock, unit, manufacturer) VALUES
  ('Paracetamol 500mg', 'Crocin', 'Analgesic', '30049099', 35, 20, 12, 500, 'Strip', 'GSK'),
  ('Amoxicillin 500mg', 'Mox', 'Antibiotic', '30041010', 120, 70, 12, 200, 'Strip', 'Ranbaxy'),
  ('ORS Sachet', 'Electral', 'Electrolyte', '30049099', 25, 12, 5, 300, 'Sachet', 'FDC'),
  ('Metformin 500mg', 'Glycomet', 'Anti-diabetic', '30049059', 65, 35, 12, 400, 'Strip', 'USV'),
  ('Amlodipine 5mg', 'Amlip', 'Antihypertensive', '30049039', 90, 48, 12, 250, 'Strip', 'Cipla'),
  ('Omeprazole 20mg', 'Omez', 'Antacid', '30049059', 45, 22, 12, 350, 'Strip', 'Dr Reddy')
ON CONFLICT DO NOTHING;
