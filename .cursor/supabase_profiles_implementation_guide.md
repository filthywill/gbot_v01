# Supabase Profiles Table: Implementation and Management Guide

## Overview

This document outlines how to implement a `profiles` table in Supabase to support the Account Settings functionality, and how to manage it across development and production environments.

The document includes:

1. The basic database structure with the profiles table schema
2. Security implementation with Row Level Security (RLS) policies
3. Automatic profile creation using triggers
4. Two approaches for managing environments:
   - Using basic SQL migration files
   - Using the Supabase CLI (recommended)
5. Instructions for modifying the schema later
6. Data backup and restoration best practices
7. Troubleshooting common issues
8. General best practices for database management
9. A complete example implementation

This markdown document can be checked into your repository as a reference for your team or future development. If you need to make any modifications to the profiles table structure or add additional fields later, you can follow the approach outlined in section 5 of the guide.

## 1. Database Structure

### Basic Profiles Table Schema

```sqlCREATE TABLE public.profiles (  id UUID REFERENCES auth.users(id) PRIMARY KEY,  username TEXT,  avatar_url TEXT,  updated_at TIMESTAMP WITH TIME ZONE,  created_at TIMESTAMP WITH TIME ZONE DEFAULT now());-- Set comment on tableCOMMENT ON TABLE public.profiles IS 'Profile information for application users';```

## 2. Security Implementation

### Row Level Security (RLS)

```sql
-- Enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create policy for profiles to be created automatically
CREATE POLICY "Profiles can be created automatically" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
```

## 3. Automatic Profile Creation

### Trigger Function

```sql
-- Function to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (new.id, split_part(new.email, '@', 1), now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Managing Environments (Dev/Prod)

### Approach 1: SQL Migration Files

1. Create a directory in your project: `/migrations`
2. Create numbered migration files:
   - `01_create_profiles_table.sql`
   - `02_create_rls_policies.sql`
   - `03_create_profile_triggers.sql`

3. Run migrations in development first to test
4. When verified, run the same migrations in production

### Approach 2: Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Create a migration:
   ```bash
   supabase migration new create_profiles
   ```

4. Add your SQL to the generated migration file in `/supabase/migrations`

5. Apply to development:
   ```bash
   supabase db push
   ```

6. Push to production when ready:
   ```bash
   supabase db push --db-url PRODUCTION_DB_URL
   ```

## 5. Modifying the Schema Later

When you need to modify the schema:

1. Always create a new migration file instead of editing existing ones
2. Follow this naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
3. Test in development before applying to production
4. Document all changes in your version control system

Example upgrade migration:

```sql
-- Migration: 20230815120000_add_avatar_url_to_profiles.sql

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Update existing profiles with default avatar (optional)
UPDATE public.profiles SET avatar_url = 'https://default-avatar-url.com/image.png';
```

## 6. Data Backup and Restoration

- Before major changes, create a backup using Supabase dashboard
- For production: Enable Point-in-Time Recovery (PITR) if available on your plan
- Document backup procedures and test restoration periodically

## 7. Troubleshooting Common Issues

### Migration Failures

If a migration fails:

1. Check Supabase logs for specific error messages
2. Test migrations in a separate development database first
3. For complex migrations, consider breaking them into smaller, sequential migrations

### "Table Already Exists" Error

If you encounter "table already exists" errors when applying migrations:

```sql
-- Use IF NOT EXISTS clause to prevent errors
CREATE TABLE IF NOT EXISTS public.profiles (
  -- table definition
);
```

### Performance Issues

If you notice slow queries after adding columns:

1. Ensure proper indexing:
   ```sql
   CREATE INDEX idx_profiles_username ON public.profiles (username);
   ```

2. Monitor query performance in the Supabase dashboard

## 8. Best Practices

1. **Version Control**: Keep all migration files in your source code repository
2. **Testing**: Test migrations on development before production
3. **Documentation**: Comment your SQL code and document schema changes
4. **Idempotency**: Make migrations idempotent (can be run multiple times without error)
5. **Small Changes**: Prefer multiple small migrations over large, complex ones
6. **Backups**: Always backup your database before applying migrations to production

## 9. Complete Implementation Example

Here's a complete example migration file that creates the profiles table with all necessary security settings:

```sql
-- Migration: 20230801000000_create_profiles_table.sql

-- Create profiles tableCREATE TABLE public.profiles (  id UUID REFERENCES auth.users(id) PRIMARY KEY,  username TEXT,  avatar_url TEXT,  updated_at TIMESTAMP WITH TIME ZONE,  created_at TIMESTAMP WITH TIME ZONE DEFAULT now());

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Profiles can be created automatically" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (new.id, split_part(new.email, '@', 1), now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add table comments
COMMENT ON TABLE public.profiles IS 'Profile information for application users';
COMMENT ON COLUMN public.profiles.id IS 'References the auth.users table';
COMMENT ON COLUMN public.profiles.username IS 'User-provided username';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';
```

By following this guide, you'll be able to implement and manage the profiles table for your Account Settings functionality, with proper security controls and a structured approach to managing changes across environments. 