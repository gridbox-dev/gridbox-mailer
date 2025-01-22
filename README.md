<div style="display: flex; gap: 10px;">
	<a href='https://www.gridbox.dev' target='_blank'>
  		<img src="https://img.shields.io/badge/Developed%20by-Gridbox-black?labelColor=gray&style=flat" alt="Developed by">
	</a>
	<a href='https://cl.linkedin.com/in/tdelrealb' target='_blank'>
  		<img src="https://img.shields.io/badge/Developed%20by-Tom%C3%A1s%20del%20Real%20B.-red?labelColor=gray&style=flat" alt="Developed by">
	</a>
	<a href='https://choosealicense.com/licenses/mit/' target='_blank'>
  	<img src="https://img.shields.io/badge/License-MIT-green?labelColor=gray&style=flat"  alt="License"/>
	</a>
</div>

<br>

# Gridbox Mailer

`Gridbox Mailer` is a flexible and easy-to-use package for managing email sending with `nodemailer`. It allows you to easily connect to an SMTP server, load and customize HTML email templates, and send emails with attachments. It handles the connection management, template processing, and email sending processes in a streamlined way.

## Table of Contents

- [Gridbox Mailer](#gridbox-mailer)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Example of use](#example-of-use)
  - [License](#license)

## [Features](#features)

- ### SMTP Connection:

  Easily connect to an SMTP server using the provided credentials.

- ### HTML Template Loading:

  Load HTML email templates from a specified directory and replace dynamic placeholders with custom values.

- ### Email Sending:

  Send emails with subject lines, HTML content, and optional attachments.

- ### Centralized Connection Management:
  Automatically manage email client connection, including connection and disconnection handling.

## [Installation](#installation)

Run the following command in the main directory of your application:

```
npm install gridbox-mailer
```

## [Example of use](#example)

This is a basic and explanatory example of the use of `Gridbox Mailer`, feel free to use it wherever you want.

```ts
import { emailClient } from "gridbox-mailer";

const sendEmail = async () => {
  const emailSender = await emailClient.connect({
    host: "smtp.gmail.com", // SMTP provider of your choice
    port: 587,
    username: "your-email@gmail.com",
    password: "your-password",
  });

  const emailContent = emailSender.loadHTMLTemplate({
    templateBasePath: "./templates", // The path where you store mail templates.
    templateName: "welcome-template", // The name of your template.
    replacements: {
      name: "John Doe",
    },
  });

  await emailSender.sendEmail({
    html: emailContent,
    subject: "Welcome to our service",
    to: "john.doe@gmail.com",
    attachments: [
      {
        filename: "logo.png", // File name to attach
        cid: "logo", // Content ID in email template
        attachmentBasePath: "./templates/assets", // The path where you store the attachment.
      },
    ],
  });
};

sendEmail();
```

## [License](#license)

MIT
