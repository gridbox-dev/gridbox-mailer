# Gridbox Mailer

`Gridbox Mailer` is a flexible and easy-to-use package for managing email sending with `nodemailer`. It allows you to easily connect to an SMTP server, load and customize HTML email templates, and send emails with attachments. It handles the connection management, template processing, and email sending processes in a streamlined way.

## Features

- ### SMTP Connection:

  Easily connect to an SMTP server using the provided credentials.

- ### HTML Template Loading:

  Load HTML email templates from a specified directory and replace dynamic placeholders with custom values.

- ### Email Sending:

  Send emails with subject lines, HTML content, and optional attachments.

- ### Centralized Connection Management:
  Automatically manage email client connection, including connection and disconnection handling.

## Installation

Run the following command in the main directory of your application:

```
npm install gridbox-mailer
```

## Usage

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

## License

MIT
