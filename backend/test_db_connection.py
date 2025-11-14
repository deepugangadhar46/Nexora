#!/usr/bin/env python3
"""
Test script to verify database connection and user lookup functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import initialize_pool, get_user_by_email, create_tables, test_connection
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    print("🔍 Testing Nexora Database Connection...")
    print("=" * 50)
    
    # Test 1: Initialize connection pool
    print("1. Testing database connection pool initialization...")
    if initialize_pool():
        print("   ✅ Database connection pool initialized successfully")
    else:
        print("   ❌ Failed to initialize database connection pool")
        return False
    
    # Test 2: Test basic connection
    print("\n2. Testing basic database connection...")
    if test_connection():
        print("   ✅ Database connection test successful")
    else:
        print("   ❌ Database connection test failed")
        return False
    
    # Test 3: Create/verify tables
    print("\n3. Creating/verifying database tables...")
    if create_tables():
        print("   ✅ Database tables created/verified successfully")
    else:
        print("   ❌ Failed to create/verify database tables")
        return False
    
    # Test 4: Test user lookup
    print("\n4. Testing user lookup functionality...")
    test_email = "aryanuppin0406@gmail.com"
    print(f"   Looking up user: {test_email}")
    
    user = get_user_by_email(test_email)
    if user:
        print(f"   ✅ User found: {user['email']} (ID: {user['id']})")
        print(f"   📊 User details: Name={user['name']}, Credits={user.get('credits', 0)}")
    else:
        print(f"   ⚠️  User not found: {test_email}")
        print("   This could mean:")
        print("   - User doesn't exist in database")
        print("   - Database connection issue")
        print("   - Email case sensitivity issue")
    
    # Test 5: List all users (for debugging)
    print("\n5. Checking total users in database...")
    try:
        from database import execute_query
        result = execute_query("SELECT COUNT(*) as count FROM users", fetch_one=True)
        if result:
            print(f"   📈 Total users in database: {result['count']}")
            
            # Show first few users
            users = execute_query("SELECT email, name, created_at FROM users LIMIT 5", fetch_all=True)
            if users:
                print("   👥 Sample users:")
                for user in users:
                    print(f"      - {user['email']} ({user['name']}) - Created: {user['created_at']}")
        else:
            print("   ⚠️  Could not count users")
    except Exception as e:
        print(f"   ❌ Error checking users: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Database connection test completed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
