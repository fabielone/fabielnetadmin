# Fabiel.net Admin Dashboard

A comprehensive admin dashboard for managing LLC formation services, built with Next.js 16, Prisma 7, and PostgreSQL.

## Features

- **Order Management** - Track order progress with document uploads, automatic status updates, and progress tracking for LLC filings, EIN applications, and document generation
- **User Management** - View and manage customer accounts, subscriptions, and order history
- **Business Management** - Monitor formed businesses, compliance tasks, and related documents
- **Pricing Management** - Configure service pricing, state filing fees, and registered agent rates
- **Coupon System** - Create and manage discount codes with flexible rules
- **Compliance Tracking** - Monitor compliance deadlines and tasks across all businesses
- **Questionnaire Management** - Track customer questionnaire responses linked to orders
- **Blog Management** - Create and publish blog posts with image uploads
- **Partner Directory** - Manage partner listings and ally referrals
- **Subscription Management** - View active subscriptions and billing history

## Tech Stack

- **Framework**: Next.js 16.1 with App Router and Turbopack
- **Database**: PostgreSQL with Prisma 7 (using PrismaPg driver adapter)
- **Styling**: Tailwind CSS v4
- **Authentication**: Custom session-based auth with HTTP-only cookies
- **File Storage**: Cloudinary for images and documents
- **UI Components**: Custom components built on Radix UI primitives



## Project Structure

```
app/
├── (dashboard)/      # Protected admin pages
│   ├── orders/       # Order management
│   ├── users/        # User management
│   ├── businesses/   # Business management
│   ├── pricing/      # Pricing configuration
│   ├── coupons/      # Coupon management
│   ├── compliance/   # Compliance tracking
│   ├── questionnaires/ # Questionnaire responses
│   ├── blog/         # Blog management
│   ├── partners/     # Partner directory
│   ├── allies/       # Ally management
│   ├── subscriptions/ # Subscription management
│   └── settings/     # Admin settings
├── api/              # API routes
├── login/            # Authentication
components/           # Reusable UI components
lib/                  # Utilities and configurations
prisma/               # Database schema
```

## License

This project is dedicated to the public domain under the [CC0 1.0 Universal (CC0 1.0) Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).

To the extent possible under law, the author(s) have waived all copyright and related or neighboring rights to this work. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)
