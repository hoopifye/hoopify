import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type EmailCodeProps = {
  username: string;
  verificationCode: string;
};

const EmailCode = (props: EmailCodeProps) => {
  const { username, verificationCode } = props;
  
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 py-[40px] font-sans text-center">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[32px]">
            <Section className="mb-[32px]">
              <Img
                src="https://new.email/static/app/placeholder.png"
                alt="hoopifye"
                className="w-[120px] h-auto object-cover mx-auto"
              />
            </Section>

            <Section>
              <Text className="mt-0 mb-[16px] font-bold text-[24px] text-gray-900">
                Verify Your Email
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] text-gray-700 leading-[24px]">
                Hi {username}, please use the verification code below to confirm your email address and complete your account setup.
              </Text>

              <Section className="mb-[32px] bg-gray-50 rounded-[8px] p-[24px]">
                <Text className="mt-0 mb-[8px] text-[14px] text-gray-600 font-medium">
                  Your verification code:
                </Text>
                <Text className="mt-0 mb-0 font-bold text-[32px] text-gray-900 tracking-[8px] font-mono">
                  {verificationCode}
                </Text>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] text-gray-600 leading-[20px]">
                Enter this code in the verification field to activate your account. This code is valid for 10 minutes.
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] text-gray-600 leading-[20px]">
                If you didn't request this verification code, you can safely ignore this email.
              </Text>

              <Hr className="my-[24px] border-gray-200" />

              <Text className="m-0 text-[12px] text-gray-500 leading-[16px]">
                Best regards, <br /> Hoopifye Team
              </Text>
            </Section>

            <Text className="m-0 mt-[8px] text-center text-[12px] text-gray-400 leading-[16px]">
              © {new Date().getFullYear()} Hoopifye. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailCode;