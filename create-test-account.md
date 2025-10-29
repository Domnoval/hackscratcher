# 🔑 CREATE TEST ACCOUNT IN SUPABASE

**For Google Play reviewers and beta testers**

---

## 📝 Test Account Credentials:

**Email:** admin@scratchoracle.com
**Password:** Password137!

---

## 🛠️ HOW TO CREATE:

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to: https://wqealxmdjpwjbhfrnplk.supabase.co
2. Click **"Authentication"** in left sidebar
3. Click **"Users"** tab
4. Click **"Add user"** button
5. Select **"Create new user"**
6. Fill in:
   - **Email:** admin@scratchoracle.com
   - **Password:** Password137!
   - **Email confirm:** ✅ YES (auto-confirm)
7. Click **"Create user"**

### Option 2: Using the App (Once it works)

1. Open Scratch Oracle app
2. Confirm age (18+)
3. Tap **"Sign Up"**
4. Enter:
   - Email: admin@scratchoracle.com
   - Password: Password137!
5. Tap **"Create Account"**
6. Done!

### Option 3: Using SQL (Advanced)

Run this in Supabase SQL Editor:

```sql
-- Create user in auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@scratchoracle.com',
  crypt('Password137!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
);
```

---

## ✅ VERIFY IT WORKS:

1. Open app
2. Tap **"Sign In"**
3. Enter credentials
4. Should login successfully!

---

## 🔧 TROUBLESHOOTING:

### "User already exists"
- The account is already created, just use it!

### "Invalid credentials"
- Check for typos
- Password is case-sensitive: `Password137!`
- Email must be exact: `admin@scratchoracle.com`

### "Email not confirmed"
- In Supabase dashboard, click user
- Click **"Confirm email"**
- Try logging in again

---

## 🎯 WHEN TO CREATE:

**Create this account AFTER:**
- The fixed build is uploaded to Play Console
- The app successfully opens (no crash)
- You can reach the Sign Up/Sign In screen

**This ensures Google reviewers can test the app!**

---

## 📧 FOR GOOGLE REVIEWERS:

If you're from Google Play reviewing this app:

**Test Credentials:**
- Email: admin@scratchoracle.com
- Password: Password137!

**If login doesn't work:**
- Email us: scratchoracle@gmail.com
- We'll create a fresh account for you
- Response time: < 24 hours

---

## 🔐 SECURITY NOTE:

This is a TEST account only. It has:
- No real user data
- No payment info
- No personal information
- Used only for app review/testing

---

**Once the app works, create this account ASAP!** ✅
