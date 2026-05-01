# AI-Powered Ticket Management System

## Problem

We receive hundreds of support emails daily. Our agents manually read, classify, and respond to each ticket - which is slow and leads to impersonal, canned responses.

## Solution

Build a ticket management system that uses AI to automatically classify, respond to, and route support tickets - delivering faster, more personalized responses to students while freeing up agents for complex issues.

## Features

- Receive support emails and create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket list with filtering and sorting
- Ticket detail view
- AI-Powered ticket classification
- AI summaries
- AI-Suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets

## Decisions

### Ticket Categories
Tickets are classified into one of three categories:
- General Question
- Technical Question
- Refund Request

### Ticket Statuses
- **Open** — ticket has been received and is awaiting action
- **Resolved** — ticket has been addressed
- **Closed** — ticket is no longer active

### User Roles & Deployment
The system is seeded with a single admin user on deployment. The admin can create additional agent accounts. Agents can manage tickets; only admins can manage users.
