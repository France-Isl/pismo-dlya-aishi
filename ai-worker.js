import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

let generatorPromise;

function progressLabel(status) {
  if (status === "initiate") return "Подготавливаю файлы модели…";
  if (status === "download") return "Загружаю локальный ИИ…";
  if (status === "progress") return "Загружаю языковую модель…";
  if (status === "done") return "Проверяю загруженные файлы…";
  if (status === "ready") return "Модель готова…";
  return "Подготавливаю локальный ИИ…";
}

async function getGenerator() {
  if (!generatorPromise) {
    const hasWebGpu = Boolean(self.navigator?.gpu);
    generatorPromise = pipeline(
      "text-generation",
      "onnx-community/Qwen2.5-0.5B-Instruct",
      {
        device: hasWebGpu ? "webgpu" : "wasm",
        dtype: hasWebGpu ? "q4f16" : "q8",
        progress_callback: progress => {
          self.postMessage({
            type: "progress",
            progress: Number.isFinite(progress.progress) ? progress.progress : 3,
            label: progressLabel(progress.status)
          });
        }
      }
    );
  }
  return generatorPromise;
}

self.addEventListener("message", async event => {
  if (event.data?.type !== "generate") return;
  try {
    const generator = await getGenerator();
    self.postMessage({ type: "ready" });
    const messages = [
      { role: "system", content: event.data.system },
      { role: "user", content: event.data.user }
    ];
    const output = await generator(messages, {
      max_new_tokens: 300,
      do_sample: true,
      temperature: .68,
      top_p: .88,
      repetition_penalty: 1.12,
      return_full_text: false
    });
    const generated = output?.[0]?.generated_text;
    const text = Array.isArray(generated) ? generated.at(-1)?.content : generated;
    if (!text) throw new Error("Модель не вернула текст");
    self.postMessage({ type: "result", text });
  } catch (error) {
    generatorPromise = null;
    self.postMessage({ type: "error", message: error?.message || "Не удалось запустить локальный ИИ" });
  }
});

