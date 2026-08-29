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

The authentication module follows **Clean Architecture & Domain-Driven Design (DDD)** principles to keep domain logic decoupled from infrastructure (MongoDB/Mongoose) and transport (HTTP/Zod).

---

### How to Add a New Field / Column to `User`

When you want to add a new property (e.g. `avatarUrl`, `role`, `phoneNumber`, `bio`) to the `User`, follow these steps:

#### Step 1: Update the Domain Entity
📁 [`src/auth/domain/user.entity.ts`](src/auth/domain/user.entity.ts)  
Add the new property to the `User` class:
```typescript
export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null; // 👈 Add field here
  // ...
}
```

#### Step 2: Update the MongoDB Mongoose Schema
📁 [`src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts`](src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts)  
Add the Mongoose `@Prop` decorator and type:
```typescript
@Schema({ collection: 'users', timestamps: true })
export class UserSchemaClass {
  // ...
  @Prop({ type: String, default: null })
  avatarUrl: string | null; // 👈 Add Mongo property here
}
```

#### Step 3: Update the Persistence Mapper
📁 [`src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts`](src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts)  
Map the MongoDB document field into the domain entity:
```typescript
export class UserMapper {
  static toDomain(doc: UserDocument): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      avatarUrl: doc.avatarUrl ?? null, // 👈 Map field here
      // ...
    });
  }
}
```

#### Step 4: Update Repository Interfaces & Implementation
📁 [`src/auth/interfaces/user-repository.interface.ts`](src/auth/interfaces/user-repository.interface.ts)  
Update `CreateUserInput` or any specific query/update methods:
```typescript
export interface CreateUserInput {
  email: string;
  passwordHash?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null; // 👈 Add to creation input
}
```

📁 [`src/auth/infrastructure/persistence/mongodb/repositories/mongo-user.repository.ts`](src/auth/infrastructure/persistence/mongodb/repositories/mongo-user.repository.ts)  
Persist the field in `create()`:
```typescript
async create(user: CreateUserInput): Promise<User> {
  const created = await this.userModel.create({
    email: user.email.toLowerCase().trim(),
    passwordHash: user.passwordHash ?? null,
    firstName: user.firstName.trim(),
    lastName: user.lastName.trim(),
    avatarUrl: user.avatarUrl ?? null, // 👈 Save to MongoDB
  });
  return UserMapper.toDomain(created);
}
```

#### Step 5 (Optional): Update DTO Validation & Controller
If the field is accepted during Sign Up or returned in responses:
* 📁 [`src/auth/dto/sign-up.dto.ts`](src/auth/dto/sign-up.dto.ts): Add validation to `signUpSchema` (e.g. `avatarUrl: z.string().url().optional()`).
* 📁 [`src/auth/controllers/auth.controller.ts`](src/auth/controllers/auth.controller.ts): Include `avatarUrl: user.avatarUrl` in `getSession()` or `signUp()` response payload if desired.

---

### How to Remove a Field / Column from `User`

To safely remove a field:
1. **Remove from Domain Entity:** Delete the property from [`src/auth/domain/user.entity.ts`](src/auth/domain/user.entity.ts).
2. **Remove from Mapper:** Delete the field mapping in [`src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts`](src/auth/infrastructure/persistence/mongodb/mappers/user.mapper.ts).
3. **Remove from Repository:** Delete from `CreateUserInput` in [`src/auth/interfaces/user-repository.interface.ts`](src/auth/interfaces/user-repository.interface.ts) and [`src/auth/infrastructure/persistence/mongodb/repositories/mongo-user.repository.ts`](src/auth/infrastructure/persistence/mongodb/repositories/mongo-user.repository.ts).
4. **Remove from Schema:** Delete the `@Prop` in [`src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts`](src/auth/infrastructure/persistence/mongodb/schemas/user.schema.ts).
5. **Remove from DTOs / Controllers:** Clean up any DTOs or Controller responses referencing the old property.

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
