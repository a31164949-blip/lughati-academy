"use client";

import { Canvas } from "@react-three/fiber";

type City3DProps = {
  points: number;
};

export default function City3D({
  points,
}: City3DProps) {
  return (
    <div className="h-[620px] w-full overflow-hidden rounded-[34px] border-4 border-white bg-sky-100 shadow-2xl">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        shadows={false}
        camera={{
          position: [9, 8, 11],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <color
          attach="background"
          args={["#bfe9ff"]}
        />

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[6, 10, 5]}
          intensity={2}
        />

        <CityScene points={points} />
      </Canvas>
    </div>
  );
}

function CityScene({
  points,
}: {
  points: number;
}) {
  return (
    <group>

      {/* أرض المدينة */}

      <mesh
        position={[0, -0.3, 0]}
        receiveShadow={false}
      >
        <boxGeometry
          args={[18, 0.6, 15]}
        />

        <meshStandardMaterial
          color="#73c982"
          roughness={1}
        />
      </mesh>

      {/* منطقة بعيدة */}

      <mesh
        position={[0, 0.02, -5]}
      >
        <boxGeometry
          args={[18, 0.08, 3]}
        />

        <meshStandardMaterial
          color="#96d89a"
          roughness={1}
        />
      </mesh>

      {/* المنزل - موجود من البداية */}

      <HeroHouse
        position={[0, 0, -2.5]}
      />

      {/* شجرة الإنجاز */}

      {points >= 50 && (
        <Tree
          position={[-4.2, 0, -1.8]}
          scale={1.25}
        />
      )}

      {/* الطريق */}

      {points >= 100 && (
        <Road />
      )}

      {/* حديقة البطل */}

      {points >= 150 && (
        <HeroGarden
          position={[4, 0, 0.4]}
        />
      )}

      {/* الإنارة */}

      {points >= 250 && (
        <>
          <StreetLamp
            position={[-1.6, 0, 0]}
          />

          <StreetLamp
            position={[1.6, 0, 0]}
          />

          <StreetLamp
            position={[-2.2, 0, 3]}
          />

          <StreetLamp
            position={[2.2, 0, 3]}
          />
        </>
      )}

      {/* حديقة الألعاب */}

      {points >= 350 && (
        <Playground
          position={[-4.2, 0, 1.4]}
        />
      )}

      {/* مكتبة لغتي */}

      {points >= 500 && (
        <Library
          position={[-4.7, 0, -4]}
        />
      )}

      {/* أكاديمية لغتي */}

      {points >= 700 && (
        <Academy
          position={[4.7, 0, -4]}
        />
      )}

      {/* طرق جانبية */}

      {points >= 700 && (
        <SideRoads />
      )}

      {/* النافورة */}

      {points >= 900 && (
        <Fountain
          position={[0, 0, 2.5]}
        />
      )}

      {/* ملعب الأبطال */}

      {points >= 1200 && (
        <Stadium
          position={[-5, 0, 4.3]}
        />
      )}

      {/* متجر المدينة */}

      {points >= 1500 && (
        <CityShop
          position={[5, 0, 4.1]}
        />
      )}

      {/* السيارة */}

      {points >= 1800 && (
        <Car
          position={[-0.8, 0.2, 4]}
        />
      )}

      {/* قصر الإنجاز */}

      {points >= 2200 && (
        <Castle
          position={[0, 0, -6]}
        />
      )}

      {/* وسط المدينة */}

      {points >= 2700 && (
        <>
          <Tower
            position={[-2.5, 0, -6]}
            height={3.2}
          />

          <Tower
            position={[2.6, 0, -6]}
            height={3.8}
          />

          <Tower
            position={[-6.3, 0, -5]}
            height={2.8}
          />

          <Tower
            position={[6.2, 0, -5]}
            height={3.1}
          />
        </>
      )}

      {/* المدينة الكبرى */}

      {points >= 3500 && (
        <>
          <Tree
            position={[-6, 0, 0]}
            scale={0.9}
          />

          <Tree
            position={[6, 0, 0]}
            scale={0.9}
          />

          <Tree
            position={[-6.5, 0, 2.6]}
            scale={0.75}
          />

          <Tree
            position={[6.5, 0, 2.6]}
            scale={0.75}
          />
        </>
      )}
    </group>
  );
}

/* ========================= */
/* المنزل */
/* ========================= */

function HeroHouse({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>

      {/* جسم المنزل */}

      <mesh position={[0, 0.75, 0]}>
        <boxGeometry
          args={[2.2, 1.5, 1.7]}
        />

        <meshStandardMaterial
          color="#f2c98f"
          roughness={0.9}
        />
      </mesh>

      {/* السقف */}

      <mesh
        position={[0, 1.7, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <coneGeometry
          args={[1.65, 1.1, 4]}
        />

        <meshStandardMaterial
          color="#c95d3c"
          roughness={0.9}
        />
      </mesh>

      {/* الباب */}

      <mesh
        position={[0, 0.55, 0.87]}
      >
        <boxGeometry
          args={[0.55, 1, 0.08]}
        />

        <meshStandardMaterial
          color="#714936"
        />
      </mesh>

      {/* نافذة يمين */}

      <Window
        position={[
          0.7,
          0.9,
          0.88,
        ]}
      />

      {/* نافذة يسار */}

      <Window
        position={[
          -0.7,
          0.9,
          0.88,
        ]}
      />

      {/* قاعدة */}

      <mesh
        position={[0, 0.08, 0]}
      >
        <boxGeometry
          args={[2.6, 0.16, 2]}
        />

        <meshStandardMaterial
          color="#d0b07d"
        />
      </mesh>
    </group>
  );
}

function Window({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <mesh position={position}>
      <boxGeometry
        args={[0.4, 0.48, 0.07]}
      />

      <meshStandardMaterial
        color="#70c4e8"
        roughness={0.4}
      />
    </mesh>
  );
}

/* ========================= */
/* الطريق */
/* ========================= */

function Road() {
  return (
    <group>
      <mesh
        position={[0, 0.05, 3.2]}
      >
        <boxGeometry
          args={[2.2, 0.1, 8]}
        />

        <meshStandardMaterial
          color="#4b5563"
          roughness={1}
        />
      </mesh>

      {[
        -0.2,
        1,
        2.2,
        3.4,
        4.6,
        5.8,
      ].map((z) => (
        <mesh
          key={z}
          position={[0, 0.12, z]}
        >
          <boxGeometry
            args={[
              0.09,
              0.03,
              0.6,
            ]}
          />

          <meshStandardMaterial
            color="#ffffff"
          />
        </mesh>
      ))}
    </group>
  );
}

function SideRoads() {
  return (
    <>
      <mesh
        position={[-3.2, 0.04, 0]}
        rotation={[
          0,
          -0.18,
          0,
        ]}
      >
        <boxGeometry
          args={[4.6, 0.08, 1.1]}
        />

        <meshStandardMaterial
          color="#59636f"
        />
      </mesh>

      <mesh
        position={[3.2, 0.04, 0]}
        rotation={[
          0,
          0.18,
          0,
        ]}
      >
        <boxGeometry
          args={[4.6, 0.08, 1.1]}
        />

        <meshStandardMaterial
          color="#59636f"
        />
      </mesh>
    </>
  );
}

/* ========================= */
/* الأشجار */
/* ========================= */

function Tree({
  position,
  scale = 1,
}: {
  position: [
    number,
    number,
    number
  ];
  scale?: number;
}) {
  return (
    <group
      position={position}
      scale={scale}
    >
      <mesh
        position={[0, 0.7, 0]}
      >
        <cylinderGeometry
          args={[
            0.18,
            0.24,
            1.4,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#795238"
        />
      </mesh>

      <mesh
        position={[
          0,
          1.65,
          0,
        ]}
      >
        <sphereGeometry
          args={[0.8, 12, 10]}
        />

        <meshStandardMaterial
          color="#3f9f58"
          roughness={1}
        />
      </mesh>

      <mesh
        position={[
          -0.42,
          1.45,
          0.05,
        ]}
      >
        <sphereGeometry
          args={[
            0.55,
            10,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#55b96b"
        />
      </mesh>

      <mesh
        position={[
          0.43,
          1.43,
          0,
        ]}
      >
        <sphereGeometry
          args={[
            0.56,
            10,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#4cae60"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* الحديقة */
/* ========================= */

function HeroGarden({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.08, 0]}
      >
        <cylinderGeometry
          args={[
            1.8,
            1.8,
            0.15,
            32,
          ]}
        />

        <meshStandardMaterial
          color="#82d69b"
        />
      </mesh>

      {[
        [-0.8, 0.15, 0.2],
        [0, 0.15, -0.5],
        [0.8, 0.15, 0.1],
        [-0.3, 0.15, 0.7],
        [0.45, 0.15, 0.65],
      ].map(
        (
          position,
          index
        ) => (
          <Flower
            key={index}
            position={
              position as [
                number,
                number,
                number
              ]
            }
          />
        )
      )}
    </group>
  );
}

function Flower({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.2, 0]}
      >
        <cylinderGeometry
          args={[
            0.03,
            0.03,
            0.4,
            6,
          ]}
        />

        <meshStandardMaterial
          color="#2f855a"
        />
      </mesh>

      <mesh
        position={[0, 0.45, 0]}
      >
        <sphereGeometry
          args={[
            0.16,
            8,
            6,
          ]}
        />

        <meshStandardMaterial
          color="#ef6690"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* أعمدة الإنارة */
/* ========================= */

function StreetLamp({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.7, 0]}
      >
        <cylinderGeometry
          args={[
            0.06,
            0.08,
            1.4,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#28313d"
        />
      </mesh>

      <mesh
        position={[0, 1.45, 0]}
      >
        <boxGeometry
          args={[
            0.3,
            0.3,
            0.3,
          ]}
        />

        <meshStandardMaterial
          color="#ffe47a"
          emissive="#d6a900"
          emissiveIntensity={0.18}
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* الألعاب */
/* ========================= */

function Playground({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.04, 0]}
      >
        <boxGeometry
          args={[2.4, 0.08, 2]}
        />

        <meshStandardMaterial
          color="#e7cf83"
        />
      </mesh>

      <mesh
        position={[-0.45, 0.8, 0]}
      >
        <boxGeometry
          args={[
            0.18,
            1.5,
            0.18,
          ]}
        />

        <meshStandardMaterial
          color="#2477a8"
        />
      </mesh>

      <mesh
        position={[0.45, 0.8, 0]}
      >
        <boxGeometry
          args={[
            0.18,
            1.5,
            0.18,
          ]}
        />

        <meshStandardMaterial
          color="#2477a8"
        />
      </mesh>

      <mesh
        position={[
          0,
          1.48,
          0,
        ]}
      >
        <boxGeometry
          args={[
            1.1,
            0.16,
            0.18,
          ]}
        />

        <meshStandardMaterial
          color="#2477a8"
        />
      </mesh>

      <mesh
        position={[0.7, 0.45, 0]}
        rotation={[
          0,
          0,
          -0.55,
        ]}
      >
        <boxGeometry
          args={[
            0.5,
            1.6,
            0.55,
          ]}
        />

        <meshStandardMaterial
          color="#ef6577"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* المكتبة */
/* ========================= */

function Library({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.9, 0]}
      >
        <boxGeometry
          args={[
            2.7,
            1.8,
            1.8,
          ]}
        />

        <meshStandardMaterial
          color="#ddc79e"
        />
      </mesh>

      <mesh
        position={[0, 1.95, 0]}
      >
        <cylinderGeometry
          args={[
            1.8,
            1.8,
            0.4,
            4,
          ]}
        />

        <meshStandardMaterial
          color="#31624e"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.65,
          0.93,
        ]}
      >
        <boxGeometry
          args={[
            0.55,
            1.2,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#704c38"
        />
      </mesh>

      <Window
        position={[
          -0.8,
          1.05,
          0.93,
        ]}
      />

      <Window
        position={[
          0.8,
          1.05,
          0.93,
        ]}
      />
    </group>
  );
}

/* ========================= */
/* الأكاديمية */
/* ========================= */

function Academy({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 1.05, 0]}
      >
        <boxGeometry
          args={[
            3.2,
            2.1,
            2,
          ]}
        />

        <meshStandardMaterial
          color="#d7a873"
        />
      </mesh>

      <mesh
        position={[0, 2.25, 0]}
      >
        <cylinderGeometry
          args={[
            2.05,
            2.05,
            0.45,
            4,
          ]}
        />

        <meshStandardMaterial
          color="#845139"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.7,
          1.02,
        ]}
      >
        <boxGeometry
          args={[
            0.65,
            1.35,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#614537"
        />
      </mesh>

      <Window
        position={[
          -1,
          1.15,
          1.03,
        ]}
      />

      <Window
        position={[
          1,
          1.15,
          1.03,
        ]}
      />
    </group>
  );
}

/* ========================= */
/* النافورة */
/* ========================= */

function Fountain({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.12, 0]}
      >
        <cylinderGeometry
          args={[
            1.2,
            1.4,
            0.25,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#cbd5dc"
        />
      </mesh>

      <mesh
        position={[0, 0.3, 0]}
      >
        <cylinderGeometry
          args={[
            0.95,
            0.95,
            0.18,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#68c6df"
          roughness={0.3}
        />
      </mesh>

      <mesh
        position={[0, 0.8, 0]}
      >
        <cylinderGeometry
          args={[
            0.16,
            0.22,
            1,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#d7dde0"
        />
      </mesh>

      <mesh
        position={[0, 1.25, 0]}
      >
        <sphereGeometry
          args={[
            0.24,
            10,
            8,
          ]}
        />

        <meshStandardMaterial
          color="#77d5ef"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* الملعب */
/* ========================= */

function Stadium({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.2, 0]}
        scale={[1.8, 1, 1]}
      >
        <cylinderGeometry
          args={[
            1.4,
            1.4,
            0.4,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#9ca6af"
        />
      </mesh>

      <mesh
        position={[0, 0.42, 0]}
        scale={[1.5, 1, 0.8]}
      >
        <cylinderGeometry
          args={[
            1.15,
            1.15,
            0.12,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#48a85d"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* المتجر */
/* ========================= */

function CityShop({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.75, 0]}
      >
        <boxGeometry
          args={[
            2.4,
            1.5,
            1.8,
          ]}
        />

        <meshStandardMaterial
          color="#f3d9a5"
        />
      </mesh>

      <mesh
        position={[
          0,
          1.55,
          0.8,
        ]}
      >
        <boxGeometry
          args={[
            2.6,
            0.35,
            0.35,
          ]}
        />

        <meshStandardMaterial
          color="#e45d63"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.65,
          0.93,
        ]}
      >
        <boxGeometry
          args={[
            0.55,
            1.2,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#5c4538"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* السيارة */
/* ========================= */

function Car({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 0.35, 0]}
      >
        <boxGeometry
          args={[
            1.35,
            0.45,
            0.75,
          ]}
        />

        <meshStandardMaterial
          color="#2b8bd2"
        />
      </mesh>

      <mesh
        position={[0, 0.7, 0]}
      >
        <boxGeometry
          args={[
            0.8,
            0.35,
            0.65,
          ]}
        />

        <meshStandardMaterial
          color="#78c8ec"
        />
      </mesh>

      {[-0.45, 0.45].map(
        (x) => (
          <mesh
            key={x}
            position={[
              x,
              0.18,
              0.4,
            ]}
            rotation={[
              Math.PI / 2,
              0,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.2,
                0.2,
                0.16,
                12,
              ]}
            />

            <meshStandardMaterial
              color="#26323b"
            />
          </mesh>
        )
      )}
    </group>
  );
}

/* ========================= */
/* القصر */
/* ========================= */

function Castle({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 1.1, 0]}
      >
        <boxGeometry
          args={[
            3.1,
            2.2,
            2,
          ]}
        />

        <meshStandardMaterial
          color="#dfc38e"
        />
      </mesh>

      <CastleTower
        position={[-1.65, 0, 0]}
      />

      <CastleTower
        position={[1.65, 0, 0]}
      />

      <mesh
        position={[
          0,
          0.75,
          1.03,
        ]}
      >
        <boxGeometry
          args={[
            0.75,
            1.5,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#74513d"
        />
      </mesh>
    </group>
  );
}

function CastleTower({
  position,
}: {
  position: [
    number,
    number,
    number
  ];
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, 1.3, 0]}
      >
        <boxGeometry
          args={[
            1,
            2.6,
            1.1,
          ]}
        />

        <meshStandardMaterial
          color="#d2ac75"
        />
      </mesh>

      <mesh
        position={[0, 2.9, 0]}
      >
        <coneGeometry
          args={[
            0.9,
            1.2,
            4,
          ]}
        />

        <meshStandardMaterial
          color="#a84f49"
        />
      </mesh>
    </group>
  );
}

/* ========================= */
/* الأبراج */
/* ========================= */

function Tower({
  position,
  height,
}: {
  position: [
    number,
    number,
    number
  ];
  height: number;
}) {
  return (
    <group position={position}>
      <mesh
        position={[
          0,
          height / 2,
          0,
        ]}
      >
        <boxGeometry
          args={[
            1.25,
            height,
            1.25,
          ]}
        />

        <meshStandardMaterial
          color="#b7c8d5"
          roughness={0.75}
        />
      </mesh>

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <mesh
          key={index}
          position={[
            0,
            0.6 +
              index *
                (height /
                  4.8),
            0.64,
          ]}
        >
          <boxGeometry
            args={[
              0.65,
              0.22,
              0.03,
            ]}
          />

          <meshStandardMaterial
            color="#4ca5cb"
          />
        </mesh>
      ))}
    </group>
  );
}