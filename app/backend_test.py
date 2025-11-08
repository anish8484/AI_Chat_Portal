import requests
import sys
import json
from datetime import datetime

class AIPortalAPITester:
    def __init__(self, base_url=""):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.conversation_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_get_conversations_empty(self):
        """Test getting conversations when empty"""
        success, response = self.run_test(
            "Get Conversations (Empty)",
            "GET",
            "conversations",
            200
        )
        return success

    def test_create_conversation(self):
        """Test creating a new conversation"""
        test_title = f"Test Conversation {datetime.now().strftime('%H:%M:%S')}"
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            data={"title": test_title}
        )
        if success and 'id' in response:
            self.conversation_id = response['id']
            print(f"   Created conversation ID: {self.conversation_id}")
        return success

    def test_get_conversations_with_data(self):
        """Test getting conversations after creating one"""
        success, response = self.run_test(
            "Get Conversations (With Data)",
            "GET",
            "conversations",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} conversations")
        return success

    def test_get_specific_conversation(self):
        """Test getting a specific conversation"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific Conversation",
            "GET",
            f"conversations/{self.conversation_id}",
            200
        )
        return success

    def test_send_message(self):
        """Test sending a message to conversation"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
            
        success, response = self.run_test(
            "Send Message",
            "POST",
            f"conversations/{self.conversation_id}/messages",
            200,
            data={"content": "Hello, this is a test message"}
        )
        if success:
            print("   Message sent successfully")
            # Note: AI response depends on LM Studio being available
        return success

    def test_end_conversation(self):
        """Test ending a conversation"""
        if not self.conversation_id:
            print("❌ Skipped - No conversation ID available")
            return False
            
        success, response = self.run_test(
            "End Conversation",
            "POST",
            f"conversations/{self.conversation_id}/end",
            200
        )
        if success:
            print("   Conversation ended successfully")
        return success

    def test_query_conversations(self):
        """Test querying conversations with intelligence"""
        success, response = self.run_test(
            "Query Conversations",
            "POST",
            "conversations/query",
            200,
            data={"query": "What topics have been discussed?"}
        )
        if success:
            print("   Query processed successfully")
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        success, _ = self.run_test(
            "Invalid Conversation ID",
            "GET",
            "conversations/invalid-id",
            404
        )
        return success

def main():
    print("🚀 Starting AI Chat Portal API Tests")
    print("=" * 50)
    
    tester = AIPortalAPITester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_api_root),
        ("Get Empty Conversations", tester.test_get_conversations_empty),
        ("Create Conversation", tester.test_create_conversation),
        ("Get Conversations With Data", tester.test_get_conversations_with_data),
        ("Get Specific Conversation", tester.test_get_specific_conversation),
        ("Send Message", tester.test_send_message),
        ("End Conversation", tester.test_end_conversation),
        ("Query Conversations", tester.test_query_conversations),
        ("Invalid Endpoints", tester.test_invalid_endpoints),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} - Unexpected error: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
