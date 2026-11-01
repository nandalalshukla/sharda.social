import { Image } from "expo-image";
import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Badge, Button, Card, Icon, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

/** Same FAQ copy the website publishes on /about-us. */
const FAQS = [
  {
    question: "What is Sharda Social?",
    answer:
      "Sharda Social is a free, student-run platform for Sharda University, Greater Noida. It combines an online library of previous year question papers, semester notes and syllabus PDFs with a campus feed where students post announcements, events, opportunities and lost & found items. It is independent and not an official university website.",
  },
  {
    question: "Where can I find Sharda University previous year question papers?",
    answer:
      "Every past paper is in the PYQs section of the library. You can filter by programme, semester, academic year or course code, or search by subject name — for example 'operating systems' or 'CSE252'. The collection covers all nine schools, including engineering, law, pharmacy, nursing, medical, dental, allied health, humanities and education.",
  },
  {
    question: "Are Sharda University notes and syllabus available too?",
    answer:
      "Yes. The Notes section holds unit-wise study notes shared by students, and the Syllabus section holds the official unit breakdown for each course, so you can see exactly what is examinable before you start revising.",
  },
  {
    question: "Do I need an account to use the Sharda online library?",
    answer:
      "No. Browsing, searching and downloading study material is open to everyone with no sign-up. You only need a free account — using your @ug.sharda.ac.in email — to upload your own material, post on the campus feed, comment or follow other students.",
  },
  {
    question: "Is Sharda Social free to use?",
    answer: "Yes, completely. It is built and run by Sharda students, and there is no charge for browsing or downloading anything in the library.",
  },
  {
    question: "Can I contribute my own notes or question papers?",
    answer:
      "Yes, and it is the main way the library grows. Sign in with your Sharda email and upload from your dashboard. Uploads are checked by a moderator before they go live, so the library stays accurate and relevant.",
  },
];

const LINKS = {
  admin: "mailto:admin@shardaonlinelibrary.com",
  mods: "mailto:mods@shardaonlinelibrary.com",
  linkedin:
    "https://www.linkedin.com/posts/nandalalshukla_shardauniversity-btech-engineering-activity-7417953428888293376-ToZ4",
  github: "https://github.com/nandalalshukla/notes-pyqssharda-frontend",
};

export default function AboutScreen() {
  const { colors } = useTheme();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(450)} style={{ alignItems: "center", gap: 12 }}>
        <Image source={require("../../assets/logo.png")} style={{ width: 84, height: 84 }} contentFit="contain" />
        <Badge label="About the platform" variant="coral" />
        <Text variant="display" align="center">
          Built for students,{"\n"}
          <Text variant="display" tone="primary">
            by the students.
          </Text>
        </Text>
        <Text tone="muted" align="center" style={{ maxWidth: 420 }}>
          Bridging the gap between exam panic and preparation with organised resources at your fingertips.
        </Text>
      </Animated.View>

      <Card style={{ gap: 10 }}>
        <View style={[styles.icon, { backgroundColor: `${colors.destructive}22` }]}>
          <Icon name="zap" size={22} color={colors.destructive} />
        </View>
        <Text variant="title">The origin story</Text>
        <Text tone="muted">
          It started with a familiar situation: the night before an exam. The syllabus was buried in chat logs, notes were scattered across
          groups, and previous year questions (PYQs) were nowhere to be found.
        </Text>
        <Text tone="muted">
          The realisation hit hard — the problem wasn&apos;t the exam itself, but the{" "}
          <Text weight="bold">disorganised resources</Text>. Students needed a single, reliable source of truth to focus on what matters:
          studying.
        </Text>
      </Card>

      <View style={[styles.solution, { backgroundColor: colors.primary }]}>
        <View style={[styles.icon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Icon name="book-open" size={22} color={colors.primaryForeground} />
        </View>
        <Text variant="title" color={colors.primaryForeground}>
          The solution
        </Text>
        <Text color={colors.primaryForeground} style={{ opacity: 0.92 }}>
          Sharda Online Library was born to solve this chaos — one place where you can access:
        </Text>
        {[
          ["Comprehensive syllabus", colors.mint],
          ["Organised lecture notes", colors.coral],
          ["Verified PYQs repository", colors.purple],
        ].map(([label, dot]) => (
          <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dot }} />
            <Text weight="semibold" color={colors.primaryForeground}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <Card style={{ gap: 10 }}>
        <Text variant="title">Official statement</Text>
        <Text tone="muted">
          This platform is a student-led initiative created to support students by organising academic resources in one place. It is not an
          official initiative of Sharda University, nor does it represent the University in any capacity.
        </Text>
        <Text tone="muted">
          All resources available on this platform are copyrighted and are the property of Sharda University. The materials are shared solely
          for educational reference in accordance with applicable policies and guidelines.
        </Text>
      </Card>

      <Text variant="title" align="center" style={{ marginTop: 6 }}>
        Meet the team
      </Text>
      <Card style={styles.team}>
        <View style={[styles.avatar, { backgroundColor: colors.purple }]}>
          <Icon name="code" size={30} color={colors.purpleForeground} />
        </View>
        <Text variant="heading">Admin team</Text>
        <Text variant="caption" tone="muted">
          PLATFORM DEVELOPERS
        </Text>
        <Text tone="muted" align="center">
          Dedicated to building and maintaining the infrastructure that keeps this library running 24/7.
        </Text>
        <Button title="Contact admin team" icon="life-buoy" onPress={() => Linking.openURL(LINKS.admin)} />
      </Card>
      <Card style={styles.team}>
        <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
          <Icon name="shield" size={30} color={colors.coralForeground} />
        </View>
        <Text variant="heading">Mod team</Text>
        <Text variant="caption" tone="muted">
          CONTENT GUARDIANS
        </Text>
        <Text tone="muted" align="center">
          Ensuring that every note, syllabus and PYQ is verified, organised and relevant for you.
        </Text>
        <Button title="Contact mod team" icon="mail" variant="outline" onPress={() => Linking.openURL(LINKS.mods)} />
      </Card>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 14 }}>
        {(
          [
            ["linkedin", LINKS.linkedin, "LinkedIn"],
            ["github", LINKS.github, "GitHub"],
          ] as const
        ).map(([icon, url, label]) => (
          <Pressable
            key={label}
            onPress={() => Linking.openURL(url)}
            accessibilityRole="link"
            accessibilityLabel={label}
            style={[styles.social, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Icon name={icon} size={20} />
          </Pressable>
        ))}
      </View>

      <Text variant="title" align="center" style={{ marginTop: 10 }}>
        Frequently asked questions
      </Text>
      <View style={{ gap: 10 }}>
        {FAQS.map((faq, i) => {
          const expanded = open === i;
          return (
            <Animated.View key={faq.question} layout={LinearTransition.duration(220)}>
              <Card onPress={() => setOpen(expanded ? null : i)} style={{ gap: 8 }} accessibilityLabel={faq.question}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text weight="bold" style={{ flex: 1 }}>
                    {faq.question}
                  </Text>
                  <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </View>
                {expanded ? (
                  <Text tone="muted" variant="small">
                    {faq.answer}
                  </Text>
                ) : null}
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 48, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  solution: { borderRadius: radius.xl, padding: 18, gap: 10 },
  team: { alignItems: "center", gap: 8, paddingVertical: 24 },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  social: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
