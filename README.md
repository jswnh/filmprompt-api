<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Authentication & Clean Architecture Guide

The authentication module uses a **Single Master Zod Schema (`userProfileSchema`)** as the single source of truth for user profile properties.

Whenever you add or remove a field in `userProfileSchema`, TypeScript strict type checking ensures you only update the necessary files, highlighting missing mappings in **red** compile errors.

---

### ➕ Example: Adding a `name` Field

Let's walk through adding a required `name` field to the `User`.

#### Step 1: Add `name` to the Master Schema
📁 **File:** [`src/auth/domain/user.entity.ts`](src/auth/domain/user.entity.ts)

Add `name` to `userProfileSchema`:

```typescript
// src/auth/domain/user.entity.ts
export const userProfileSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1), // 👈 1. ADD YOUR FIELD HERE
});

export type UserProfile = z.infer<typeof userProfileSchema>;
```

---

#### Step 2: Add Mongoose `@Prop` in the Database Schema
📁 **File:** [`src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts`](src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts)

Add the property for MongoDB storage:

```typescript
// src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts
@Schema({ collection: 'users', timestamps: true })
export class UserSchemaClass {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ type: String, required: true, trim: true }) // 👈 2. ADD MONGO PROPERTY
  name: string;

  @Prop({ type: String, default: null })
  passwordHash: string | null;
  // ...
}
```

---

#### Step 3: Map the Field in `UserMapper` (TypeScript turns RED here!)
📁 **File:** [`src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts`](src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts)

Because `UserProfile` now requires `name`, TypeScript will immediately show a **red error**:
> 🚨 *Property 'name' is missing in type '{ email: string; }' but required in type 'UserProfile'.*

Fix it by mapping `doc.name`:

```typescript
// src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts
export class UserMapper {
  static toDomain(doc: UserDocument): User {
    const profile: UserProfile = {
      email: doc.email,
      name: doc.name, // 👈 3. MAP THE FIELD HERE (clears the red error)
    };

    const system: UserSystemFields = {
      id: doc._id.toString(),
      emailVerifiedAt: doc.emailVerifiedAt ?? null,
      emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
      emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
      passwordResetTokenHash: doc.passwordResetTokenHash ?? null,
      passwordResetExpiresAt: doc.passwordResetExpiresAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    return new User({
      ...profile,
      ...system,
    });
  }
}
```

---

#### 🎉 That's it! Everything else works automatically:
1. **`POST /api/v1/auth/sign-up`**: `signUpSchema` automatically requires `{ email, password, name }`.
2. **`GET /api/v1/auth/session` & `POST /sign-in`**: Responses automatically return `{ id, email, name, emailVerified, ... }`.
3. **`MongoUserRepository.create`**: Automatically saves `name` to MongoDB.
4. **`@CurrentUser() user: User`**: Contains `user.name` in any controller across your application.

---

### ➖ Example: Removing the `name` Field

When you want to remove the `name` field, simply follow these 3 steps:

#### Step 1: Remove from Master Schema
📁 **File:** [`src/auth/domain/user.entity.ts`](src/auth/domain/user.entity.ts)

```typescript
// Delete the 'name' line from userProfileSchema:
export const userProfileSchema = z.object({
  email: z.string().email(),
});
```

---

#### Step 2: Remove from `UserMapper` (TypeScript turns RED on the old property!)
📁 **File:** [`src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts`](src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts)

TypeScript will show a **red error** on `name: doc.name`. Delete that line:

```typescript
const profile: UserProfile = {
  email: doc.email, // 👈 'name' removed
};
```

---

#### Step 3: Remove Mongoose `@Prop` from Database Schema
📁 **File:** [`src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts`](src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts)

Delete the `@Prop` for `name`:

```typescript
// Delete this line:
// @Prop({ type: String, required: true, trim: true })
// name: string;
```

---

#### 🎉 Done!
All DTOs, controllers, responses, and types update automatically!

---

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
