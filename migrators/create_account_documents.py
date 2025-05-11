import os
import sys
import getpass
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.users import Users as AppwriteUsers # Renamed to avoid conflict with User model if any
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.query import Query
from appwrite.permission import Permission
from appwrite.role import Role
# AppwriteException import removed

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# You can override these by setting them in your .env file or environment
APPWRITE_ENDPOINT = os.getenv('APPWRITE_ENDPOINT', 'https://fra.cloud.appwrite.io/v1')
APPWRITE_PROJECT_ID = os.getenv('APPWRITE_PROJECT_ID', 'draconic-chatroom')
APPWRITE_DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID', 'database')
APPWRITE_COLLECTION_ID_ACCOUNTS = os.getenv('APPWRITE_COLLECTION_ID_ACCOUNTS', 'accounts')

def get_api_key():
    """Retrieves the Appwrite API key from environment variables or prompts the user."""
    api_key = os.getenv('APPWRITE_API_KEY')
    if not api_key:
        print("Appwrite API Key not found in .env file or environment variables.")
        print("Please provide an API key with 'users.read' and 'documents.write' permissions.")
        api_key = getpass.getpass("Enter your Appwrite API Key: ")
    if not api_key:
        print("API Key is required to run the script. Exiting.")
        sys.exit(1)
    return api_key

def main():
    """Main function to migrate user accounts to the accounts collection."""
    api_key = get_api_key()

    print(f"Initializing Appwrite client for project: {APPWRITE_PROJECT_ID} at {APPWRITE_ENDPOINT}")

    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(api_key)

    users_service = AppwriteUsers(client)
    databases_service = Databases(client)

    print(f"Fetching users from project '{APPWRITE_PROJECT_ID}'...")

    all_users = []
    offset = 0
    limit = 100 # Appwrite's max limit for listing is often 100

    try:
        while True:
            response = users_service.list(queries=[Query.limit(limit), Query.offset(offset)])
            current_batch_users = response['users']
            all_users.extend(current_batch_users)
            
            print(f"Fetched {len(current_batch_users)} users (total so far: {len(all_users)} / {response['total']})...")

            if len(all_users) >= response['total']:
                break
            offset += limit
        
        print(f"\nTotal users fetched: {len(all_users)}")

    except Exception as e: # Catching generic Exception
        message = getattr(e, 'message', str(e))
        code = getattr(e, 'code', None)
        if code is not None: # Check if it seems like an AppwriteException
            print(f"Error fetching users: {message} (Code: {code})")
        else:
            print(f"Error fetching users: {message}")
        sys.exit(1)
    # Removed the more specific AppwriteException catch for fetching users,
    # as the generic Exception catch above will handle it.
    # If you need to distinguish other non-Appwrite exceptions, add more specific catches before the generic one.
    except Exception as e: # This remains as a fallback for truly unexpected errors
        print(f"An unexpected error occurred during user fetching: {e}")
        sys.exit(1)


    created_count = 0
    skipped_count = 0
    error_count = 0

    print(f"\nProcessing users and creating documents in collection '{APPWRITE_COLLECTION_ID_ACCOUNTS}' (Database: '{APPWRITE_DATABASE_ID}')...")
    for user in all_users:
        user_id = user['$id']
        username = user.get('name') or user.get('email') # Use name, fallback to email
        if not username: # If both name and email are empty
            print(f"Warning: User ID {user_id} has no name or email. Setting username to 'Anonymous_{user_id}'.")
            username = f"Anonymous_{user_id}"

        try:
            # Check if document already exists
            try:
                databases_service.get_document(
                    database_id=APPWRITE_DATABASE_ID,
                    collection_id=APPWRITE_COLLECTION_ID_ACCOUNTS,
                    document_id=user_id
                )
                print(f"Account document for user '{username}' (ID: {user_id}) already exists. Skipping.")
                skipped_count += 1
                continue
            except Exception as e: # Catching generic Exception
                # Check if it's an Appwrite-like 404 error
                is_appwrite_404 = False
                if hasattr(e, 'code') and getattr(e, 'code') == 404:
                    is_appwrite_404 = True
                
                if is_appwrite_404: # Document not found, proceed to create
                    pass
                else: # Other error during get_document
                    message = getattr(e, 'message', str(e))
                    code = getattr(e, 'code', None)
                    type_ = getattr(e, 'type', None)
                    print(f"  Error checking for existing document for user '{username}' (ID: {user_id}):")
                    if code is not None and type_ is not None:
                        print(f"    Appwrite-like Error: {message} (Code: {code}, Type: {type_})")
                    else:
                        print(f"    Error: {message}")
                    print(f"  Skipping user {user_id} due to this error.")
                    error_count += 1
                    continue # Skip to the next user

            # Create document
            document_data = {'username': username}
            permissions = [
                Permission.read(Role.any()),
                Permission.update(Role.user(user_id)),
                Permission.delete(Role.user(user_id))
            ]
            
            databases_service.create_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_COLLECTION_ID_ACCOUNTS,
                document_id=user_id, # Use user's ID as document ID
                data=document_data,
                permissions=permissions
            )
            print(f"Successfully created account document for user '{username}' (ID: {user_id}).")
            created_count += 1

        except Exception as e: # Catching generic Exception
            message = getattr(e, 'message', str(e))
            code = getattr(e, 'code', None)
            type_ = getattr(e, 'type', None)
            
            if code is not None and type_ is not None: # Likely an AppwriteException
                print(f"Appwrite-like Error creating document for user '{username}' (ID: {user_id}): {message} (Code: {code}, Type: {type_})")
            else: # Generic exception
                print(f"Error creating document for user '{username}' (ID: {user_id}): {message}")
            error_count += 1
            
    print("\n--- Migration Summary ---")
    print(f"Total users processed: {len(all_users)}")
    print(f"Account documents created: {created_count}")
    print(f"Account documents skipped (already existed): {skipped_count}")
    print(f"Errors encountered: {error_count}")
    print("-------------------------")

if __name__ == "__main__":
    print("Starting Appwrite Account Document Migration Script...")
    print("IMPORTANT: Ensure your API key has 'users.read' and 'documents.write' (for the 'accounts' collection) permissions.")
    main()
    print("Migration script finished.")
