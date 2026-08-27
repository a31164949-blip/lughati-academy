import {
  doc,
  serverTimestamp,
  type Transaction,
  type DocumentSnapshot,
} from "firebase/firestore";

import { db } from "../../firebase";

type MilestoneStudentData = {
  studentId: string;
  studentName: string;
  classroom: string;
  previousPoints: number;
  newPoints: number;
  rewardType: string;
};

const pointMilestones = [
  {
    id: "firstPoints",
    points: 1,
    title: "أول طالب يسجل نقاطًا في أكاديمية لغتي",
    badgeTitle: "رائد أكاديمية لغتي",
  },
  {
    id: "first10Points",
    points: 10,
    title: "أول طالب يصل إلى 10 نقاط",
    badgeTitle: "بطل الـ 10 نقاط",
  },
  {
    id: "first25Points",
    points: 25,
    title: "أول طالب يصل إلى 25 نقطة",
    badgeTitle: "نجم الـ 25 نقطة",
  },
  {
    id: "first50Points",
    points: 50,
    title: "أول طالب يصل إلى 50 نقطة",
    badgeTitle: "بطل الـ 50 نقطة",
  },
  {
    id: "first100Points",
    points: 100,
    title: "أول طالب يصل إلى 100 نقطة",
    badgeTitle: "ملك الـ 100 نقطة",
  },
  {
    id: "first250Points",
    points: 250,
    title: "أول طالب يصل إلى 250 نقطة",
    badgeTitle: "نجم الإنجاز",
  },
  {
    id: "first500Points",
    points: 500,
    title: "أول طالب يصل إلى 500 نقطة",
    badgeTitle: "أسطورة الإنجاز",
  },
  {
    id: "first1000Points",
    points: 1000,
    title: "أول طالب يصل إلى 1000 نقطة",
    badgeTitle: "أسطورة أكاديمية لغتي",
  },
];

export async function checkAndRegisterPointMilestones(
  transaction: Transaction,
  data: MilestoneStudentData
) {
  const earnedPoints =
    data.newPoints > data.previousPoints;

  if (!earnedPoints) {
    return;
  }

  const reachedMilestones =
    pointMilestones.filter((milestone) => {
      // أول عملية نقاط بعد تشغيل سجل الأوائل
      if (milestone.id === "firstPoints") {
        return true;
      }

      // بقية المراحل يجب أن يعبر الطالب حدها فعليًا
      return (
        data.previousPoints < milestone.points &&
        data.newPoints >= milestone.points
      );
    });

  if (reachedMilestones.length === 0) {
    return;
  }

  const milestoneReferences =
    reachedMilestones.map((milestone) => ({
      milestone,
      reference: doc(
        db,
        "academyMilestones",
        milestone.id
      ),
    }));

  // جميع القراءات أولًا
  const milestoneSnapshots:
    DocumentSnapshot[] = [];

  for (const item of milestoneReferences) {
    const snapshot =
      await transaction.get(
        item.reference
      );

    milestoneSnapshots.push(snapshot);
  }

  // ثم جميع عمليات الكتابة
  milestoneReferences.forEach(
    (item, index) => {
      const snapshot =
        milestoneSnapshots[index];

      // صاحب الإنجاز الأول لا يتغير أبدًا
      if (snapshot.exists()) {
        return;
      }

      transaction.set(
        item.reference,
        {
          milestoneType: "points",

          milestoneId:
            item.milestone.id,

          title:
            item.milestone.title,

          badgeTitle:
            item.milestone.badgeTitle,

          studentId:
            data.studentId,

          studentName:
            data.studentName,

          classroom:
            data.classroom,

          pointsReached:
            item.milestone.id ===
            "firstPoints"
              ? data.newPoints
              : item.milestone.points,

          pointsBefore:
            data.previousPoints,

          pointsAfter:
            data.newPoints,

          rewardType:
            data.rewardType,

          permanent: true,

          celebrationShown: false,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );
    }
  );
}