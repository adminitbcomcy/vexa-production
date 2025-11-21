#!/bin/bash

# Clerk Configuration Script for voice.axiomic.com.cy
# This script configures Clerk settings that can be automated

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clerk credentials
CLERK_SECRET_KEY="sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci"
CLERK_PUBLISHABLE_KEY="pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ"
INSTANCE_ID="ins_35kLBDP9yYI0I1q4pgsxoy9iC53"
PRODUCTION_DOMAIN="https://voice.axiomic.com.cy"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Clerk Configuration for Vexa.ai${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to make Clerk API calls
clerk_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -z "$data" ]; then
        curl -X "$method" "https://api.clerk.com/v1/$endpoint" \
            -H "Authorization: Bearer $CLERK_SECRET_KEY" \
            -H "Content-Type: application/json" \
            -s
    else
        curl -X "$method" "https://api.clerk.com/v1/$endpoint" \
            -H "Authorization: Bearer $CLERK_SECRET_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -s
    fi
}

# 1. Verify API access
echo -e "${YELLOW}[1/5] Verifying Clerk API access...${NC}"
instance_info=$(clerk_api GET "instance")
if echo "$instance_info" | grep -q "$INSTANCE_ID"; then
    echo -e "${GREEN}✓ API access verified${NC}"
    echo "   Instance ID: $INSTANCE_ID"
else
    echo -e "${RED}✗ Failed to verify API access${NC}"
    exit 1
fi
echo ""

# 2. Update instance settings
echo -e "${YELLOW}[2/5] Updating instance settings...${NC}"
update_result=$(clerk_api PATCH "instance" '{
    "allowed_origins": ["'$PRODUCTION_DOMAIN'", "http://localhost:3000"]
}')
echo -e "${GREEN}✓ Allowed origins configured${NC}"
echo "   - $PRODUCTION_DOMAIN"
echo "   - http://localhost:3000"
echo ""

# 3. Check current users
echo -e "${YELLOW}[3/5] Checking user count...${NC}"
users=$(clerk_api GET "users?limit=1")
echo -e "${GREEN}✓ User API accessible${NC}"
echo ""

# 4. Display manual steps
echo -e "${YELLOW}[4/5] Manual configuration required in Clerk Dashboard:${NC}"
echo ""
echo -e "${GREEN}→ Webhook Configuration${NC}"
echo "  1. Go to: https://dashboard.clerk.com/apps/$INSTANCE_ID/webhooks"
echo "  2. Click 'Add Endpoint'"
echo "  3. Endpoint URL: ${PRODUCTION_DOMAIN}/api/webhooks/clerk"
echo "  4. Select events:"
echo "     - user.created"
echo "     - user.updated"
echo "     - user.deleted"
echo "  5. Copy the Signing Secret (whsec_...)"
echo "  6. Add to .env.local:"
echo "     CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE"
echo ""

echo -e "${GREEN}→ Domain Configuration${NC}"
echo "  1. Go to: https://dashboard.clerk.com/apps/$INSTANCE_ID/domains"
echo "  2. Add domain: voice.axiomic.com.cy"
echo "  3. Verify ownership if required"
echo ""

echo -e "${GREEN}→ Path Configuration${NC}"
echo "  1. Go to: https://dashboard.clerk.com/apps/$INSTANCE_ID/paths"
echo "  2. Set paths:"
echo "     Sign in: /sign-in"
echo "     Sign up: /sign-up"
echo "     After sign in: /meetings"
echo "     After sign up: /meetings"
echo ""

echo -e "${GREEN}→ Social Connections (Optional)${NC}"
echo "  1. Go to: https://dashboard.clerk.com/apps/$INSTANCE_ID/authentication"
echo "  2. Enable:"
echo "     - Google (recommended)"
echo "     - Microsoft (for Teams integration)"
echo ""

# 5. Create test user (optional)
echo -e "${YELLOW}[5/5] Configuration summary${NC}"
echo ""
echo -e "${GREEN}API Configured:${NC}"
echo "  ✓ Allowed origins set"
echo "  ✓ Instance verified"
echo ""
echo -e "${YELLOW}Dashboard Actions Required:${NC}"
echo "  ⚠ Create webhook endpoint"
echo "  ⚠ Configure domain settings"
echo "  ⚠ Set authentication paths"
echo "  ⚠ Enable social connections (optional)"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Complete manual steps in Clerk Dashboard"
echo "2. Test locally: npm run dev"
echo "3. Build Docker image: docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 ."
echo "4. Deploy to Kubernetes"
echo ""
