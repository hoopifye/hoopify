import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type VerifyEmailProps = {
  username: string;
  verifyUrl: string;
};

const VerifyEmail = (props: VerifyEmailProps) => {
  const { username, verifyUrl } = props;
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 py-[40px] font-sans text-center">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[32px]">
            <Section>
              <Text className="mt-0 mb-[16px] font-bold text-[24px] text-gray-900">
                Confirm Your Account
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] text-gray-700 leading-[24px]">
                Thanks {username} for signing up, ! To complete your registration
                and secure your account, please verify your email address by
                clicking the button below.
              </Text>

              <Section className="mb-[32px]">
                <Button
                  className="box-border rounded-[6px] bg-black px-[32px] py-[12px] font-medium text-[16px] text-white no-underline"
                  href={verifyUrl}
                >
                  Verify Email Address
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] text-gray-600 leading-[20px]">
                If the button doesn't work, you can copy and paste this link
                into your browser:
                <br />
                {verifyUrl}
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] text-gray-600 leading-[20px]">
                This verification link will expire in 24 hours. If you didn't
                create an account, you can safely ignore this email.
              </Text>

              <Hr className="my-[24px] border-gray-200" />

              <Text className="m-0 text-[12px] text-gray-500 leading-[16px]">
                Best regards, <br /> Hoopifye Team
              </Text>
            </Section>

              <Text className="m-0 mt-[8px] text-center text-[12px] text-gray-400 leading-[16px]">
                | © {new Date().getFullYear()} Hoopifye. All rights reserved.
              </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyEmail;