#!/bin/bash

# Script to set up Vercel environment variables for enhanced chatbot
echo "Setting up Vercel environment variables for enhanced chatbot..."

# Read the current .env file to get the values
source docs/chat-bot/.env

echo "Adding environment variables to Vercel..."

# Add the required environment variables (you'll need to run these manually)
echo "Please run these commands manually to add environment variables to Vercel:"
echo ""
echo "vercel env add OPENAI_API_KEY"
echo "Value: $OPENAI_API_KEY"
echo ""
echo "vercel env add GITHUB_TOKEN"
echo "Value: $GITHUB_TOKEN"
echo ""
echo "vercel env add GITHUB_OWNER"
echo "Value: $GITHUB_OWNER"
echo ""
echo "vercel env add GITHUB_REPO"
echo "Value: $GITHUB_REPO"
echo ""
echo "vercel env add ANTHROPIC_API_KEY"
echo "Value: $ANTHROPIC_API_KEY"
echo ""
echo "After adding these, run: vercel env ls to verify"