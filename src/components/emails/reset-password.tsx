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

type ResetPasswordProps = {
  username?: string | null;
  resetUrl: string;
};

const ResetPasswordEmail = (props: ResetPasswordProps) => {
  const { username, resetUrl } = props;
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 py-[40px] font-sans text-center">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[32px]">
            <Section>
              <Img
                src="https://placeholder.png"
                alt="hoopifye"
                className="w-[120px] h-auto object-cover mx-auto"
              />

              <Text className="mt-0 mb-[16px] font-bold text-[24px] text-gray-900">
                Reset your password
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] text-gray-700 leading-[24px]">
                Hello {username ?? "there"}, we received a request to reset your
                password. Click the button below to set a new password for your account.
              </Text>

              <Section className="mb-[32px]">
                <Button
                  className="box-border rounded-[6px] bg-black px-[32px] py-[12px] font-medium text-[16px] text-white no-underline"
                  href={resetUrl}
                >
                  Reset Password
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] text-gray-600 leading-[20px]">
                If the button doesn't work, copy and paste this link into your
                browser:
                <br />
                {resetUrl}
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] text-gray-600 leading-[20px]">
                This link will expire in 1 hour. If you didn't request a
                password reset, you can safely ignore this email.
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

export default ResetPasswordEmail;