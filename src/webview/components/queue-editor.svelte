<script>
  const vscode = acquireVsCodeApi();

  export let bindings = [];
  export let name;
  export let overviewDetails = [];

  let addBindingData = {
    destination: "",
    destination_type: "q",
    source: "",
    routing_key: "",
    arguments: {},
  };

  let publishMessageData = {
    name: "amq.default",
    routing_key: "",
    delivery_mode: 1,
    payload: "",
    headers: {},
    props: {},
    payload_encoding: "string",
  };

  let purgeMessagesData = {
    name: "",
    mode: "purge",
  };

  let argumentsData = [{ idx: 1, key: "", value: "" }];
  let headersData = [{ idx: 1, key: "", value: "" }];
  let propsData = [{ idx: 1, key: "", value: "" }];

  function addArgument() {
    argumentsData = [
      ...argumentsData,
      { idx: argumentsData.length + 1, key: "", value: "" },
    ];
  }

  function removeArgument(idx) {
    argumentsData = argumentsData.filter(function (arg) {
      return arg.idx !== idx;
    });
  }

  function addHeader() {
    headersData = [
      ...headersData,
      { idx: headersData.length + 1, key: "", value: "" },
    ];
  }

  function removeHeader(idx) {
    headersData = headersData.filter(function (arg) {
      return arg.idx !== idx;
    });
  }

  function addProps() {
    propsData = [
      ...propsData,
      { idx: propsData.length + 1, key: "", value: "" },
    ];
  }

  function removeProps(idx) {
    propsData = propsData.filter(function (arg) {
      return arg.idx !== idx;
    });
  }

  function addBinding() {
    const args = Object.fromEntries(
      argumentsData
        .filter(({ key }) => key !== "")
        .map(({ key, value }) => [key, value])
    );

    vscode.postMessage({
      type: "add-binding",
      data: { ...addBindingData, arguments: args },
    });

    addBindingData = {
      destination: "",
      destination_type: "q",
      source: "",
      routing_key: "",
      arguments: {},
    };
    argumentsData = [{ idx: 1, key: "", value: "" }];
  }

  function removeBinding(binding) {
    vscode.postMessage({
      type: "remove-binding",
      data: {
        vhost: binding.vhost,
        source: binding.source,
        destination: binding.destination,
        properties_key: binding.properties_key,
        destination_type: "q",
      },
    });
  }

  function publishData() {
    const headers = Object.fromEntries(
      headersData
        .filter(({ key }) => key !== "")
        .map(({ key, value }) => [key, value])
    );

    const props = Object.fromEntries(
      propsData
        .filter(({ key }) => key !== "")
        .map(({ key, value }) => [key, value])
    );
    const data = {
      ...publishMessageData,
      props,
      headers,
      properties: {
        delivery_mode: publishMessageData.delivery_mode,
        headers,
        ...props,
      },
    };
    vscode.postMessage({
      type: "publish-message",
      data: data,
    });
  }

  function purgeMessages() {
    vscode.postMessage({
      type: "purge-messages",
      data: purgeMessagesData,
    });
  }

  $: window.addEventListener("message", (event) => {
    bindings = event.data.bindings;
    const overview = event.data.overview;
    name = event.data.name;
    addBindingData.destination = event.data.name;
    publishMessageData.routing_key = event.data.name;
    purgeMessagesData.name = event.data.name;

    const formattedArguments = Object.entries(overview.arguments)
      .map(([key, value]) => `${key} = ${value}`)
      .join("\n");

    overviewDetails = [
      {
        key: "Type",
        value: overview.type,
      },
      {
        key: "Features",
        value: `durable = ${overview.durable}\nexclusive = ${overview.exclusive}\npolicy = ${overview.policy}`,
      },
      {
        key: "Arguments",
        value: formattedArguments,
      },
      {
        key: "Consumers",
        value: overview.consumers,
      },
    ];
  });
</script>

<main>
  <div class="queue-container">
    <div class="queue-name">
      <i class="codicon codicon-database icon queue-icon" />
      <div id="queue-name">{name}</div>
    </div>
    <div class="queue-section">
      <div class="queue-section-title">‣ Overview</div>
    </div>
    <table class="overview-table">
      {#each overviewDetails as overview}
        <tr>
          <td>{overview.key}</td>
          <td
            ><div class="overview-value">
              {overview.value}
            </div></td
          >
        </tr>
      {/each}
    </table>
    <div class="queue-section">
      <div class="queue-section-title">‣ Bindings</div>
    </div>
    <table class="bindings-table">
      <tr>
        <th class="bindings-th">From</th>
        <th class="bindings-th">Routing Key</th>
        <th class="bindings-th">Arguments</th>
        <th class="bindings-th" />
      </tr>
      {#each bindings as binding}
        {#if binding.source !== ""}
          <tr>
            <td class="bindings-td">
              <div class="exchange-binding">
                <i class="codicon codicon-remote icon" />{binding.source}
              </div>
            </td>
            <td class="bindings-td">{binding.routing_key}</td>
            <td class="bindings-td"
              >{JSON.stringify(binding.arguments, null, 2)}</td
            >
            <td class="bindings-td">
              <button
                type="button"
                class="trash-btn"
                on:click={() => removeBinding(binding)}
                ><i class="codicon codicon-trash" /></button
              >
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="merged-td">(Default exchange binding)</td>
          </tr>
        {/if}
      {/each}
    </table>
    <div class="add-binding-title">Add binding to this queue</div>
    <div class="add-binding">
      <div class="add-binding-fields">
        <div class="add-binding-key">From exchange</div>
        <div class="add-binding-key">Routing Key</div>
        <div class="add-binding-key">Arguments</div>
      </div>
      <div class="add-binding-fields">
        <input
          type="text"
          id="queue-queue-name"
          class="vscode-input add-binding-input"
          bind:value={addBindingData.source}
        />
        <input
          type="text"
          id="routing-key"
          class="vscode-input add-binding-input"
          bind:value={addBindingData.routing_key}
        />
        {#each argumentsData as argument}
          <div class="add-binding-args">
            <input
              type="text"
              id="arguments-key"
              class="vscode-input add-binding-input"
              bind:value={argument.key}
            />
            <div>=</div>
            <input
              type="text"
              id="arguments-value"
              class="vscode-input add-binding-input"
              bind:value={argument.value}
            />
            <select
              name="arg-type"
              id="arg-type"
              class="vscode-dropdown add-binding-input"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
            <button
              type="button"
              class="trash-btn"
              on:click={() => removeArgument(argument.idx)}
              ><i class="codicon codicon-trash" /></button
            >
          </div>
        {/each}
        <div class="add-args">
          <button
            type="button"
            class="add-args-btn vscode-button"
            on:click={addArgument}>+ Add argument</button
          >
        </div>
      </div>
    </div>
    <button type="button" class="vscode-button" on:click={addBinding}
      >Bind</button
    >
    <div class="queue-section">
      <div class="queue-section-title">‣ Publish message</div>
    </div>
    <div class="add-binding-title">
      Message will be published to the default exchange with routing key
      <b>queue.bind_accounts_to_sto_rules</b>, routing it to this queue.
    </div>
    <div class="add-binding">
      <div class="add-binding-fields">
        <div class="add-binding-key">Delivery mode</div>
        {#each headersData as header}
          <div class="add-binding-key">Headers</div>
        {/each}
        {#each propsData as prop}
          <div class="add-binding-key" />
          <div class="add-binding-key">Properties</div>
        {/each}
        <div class="add-binding-key" />
        <div class="add-binding-key">Payload</div>
      </div>
      <div class="add-binding-fields">
        <select
          name="msg-delivery-type"
          id="msg-delivery-type"
          class="vscode-dropdown add-binding-input"
          bind:value={publishMessageData.delivery_mode}
        >
          <option value={1}>Non-Persistent</option>
          <option value={2}>Persistent</option>
        </select>
        {#each headersData as header}
          <div class="add-binding-args">
            <input
              type="text"
              id="msg-headers-key"
              class="vscode-input add-binding-input"
              bind:value={header.key}
            />
            <div>=</div>
            <input
              type="text"
              id="msg-headers-value"
              class="vscode-input add-binding-input"
              bind:value={header.value}
            />
            <select
              name="msg-header-type"
              id="msg-header-type"
              class="vscode-dropdown add-binding-input"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
            <button
              type="button"
              class="trash-btn"
              on:click={() => removeHeader(header.idx)}
              ><i class="codicon codicon-trash" /></button
            >
          </div>
        {/each}
        <div class="add-args">
          <button
            type="button"
            class="add-args-btn vscode-button"
            on:click={addHeader}>+ Add header</button
          >
        </div>
        {#each propsData as prop}
          <div class="add-binding-args">
            <input
              type="text"
              id="msg-props-key"
              class="vscode-input add-binding-input"
              bind:value={prop.key}
            />
            <div>=</div>
            <input
              type="text"
              id="msg-props-value"
              class="vscode-input add-binding-input"
              bind:value={prop.value}
            />
            <button
              type="button"
              class="trash-btn"
              on:click={() => removeProps(prop.idx)}
              ><i class="codicon codicon-trash" /></button
            >
          </div>
        {/each}
        <div class="add-args">
          <button
            type="button"
            class="add-args-btn vscode-button"
            on:click={addProps}>+ Add props</button
          >
        </div>
        <input
          type="text"
          id="msg-payload"
          class="vscode-input add-binding-input"
          bind:value={publishMessageData.payload}
        />
      </div>
    </div>
    <button
      type="button"
      class="publish-btn vscode-button"
      on:click={publishData}>Publish</button
    >
    <div class="queue-section">
      <div class="queue-section-title">‣ Purge</div>
    </div>
    <button type="button" class="vscode-button" on:click={purgeMessages}
      >Purge Messages</button
    >
  </div>
</main>

<style>
  @import "@vscode/codicons/dist/codicon.css";
  @import "./vscode.css";

  .queue-container {
    margin: 50px;
  }
  .queue-name {
    display: flex;
    align-items: center;
    font-size: 20px;
    margin-bottom: 24px;
  }
  .queue-icon {
    color: var(--vscode-terminal-ansiBlue);
  }
  .queue-section {
    border-bottom: 0.1px solid var(--vscode-button-secondaryHoverBackground);
    padding-bottom: 15px;
    margin: 36px 0 18px 0;
  }
  .queue-section-title {
    font-size: 16px;
    font-weight: bold;
  }
  .overview-table {
    border-collapse: collapse;
  }
  .overview-value {
    white-space: pre;
    font-family: var(--vscode-editor-font-family);
  }
  .bindings-table,
  .bindings-th,
  .bindings-td {
    border: 1px solid var(--vscode-tree-tableColumnsBorder);
    border-collapse: collapse;
  }
  .bindings-table {
    margin: 20px 0 20px 0;
  }
  .bindings-th {
    padding: 10px;
    background-color: var(--vscode-keybindingTable-headerBackground);
  }
  .bindings-td {
    padding: 10px;
    background-color: var(--vscode-keybindingTable-rowsBackground);
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
  }
  .merged-td {
    background-color: var(--vscode-keybindingTable-rowsBackground);
    border: 1px solid var(--vscode-tree-tableColumnsBorder);
    border-collapse: collapse;
  }
  .exchange-binding {
    color: var(--vscode-terminal-ansiCyan);
    display: flex;
    align-items: center;
  }
  .icon {
    margin: 0 5px 0 0;
  }

  .add-binding-title {
    padding: 0 0 5px 0;
    margin-bottom: 20px;
  }
  .add-binding {
    display: flex;
  }
  .add-binding-fields {
    display: flex;
    flex-direction: column;
  }
  .add-binding-key {
    padding: 6px;
    margin: 6px;
  }
  .add-binding-input {
    padding: 5px;
    margin: 5px 10px;
  }
  .add-binding-args {
    display: flex;
    align-items: center;
  }
  .trash-btn {
    background-color: transparent;
    color: #aab2c0;
    border: transparent;
    cursor: pointer;
    padding: 5px 10px;
  }

  .trash-btn:hover {
    background-color: transparent;
    color: var(--vscode-button-foreground);
  }

  .add-args {
    margin-top: 5px;
    display: flex;
    justify-content: flex-end;
  }

  .add-args-btn {
    width: fit-content;
    color: #aab2c0;
    background-color: transparent;
  }

  .publish-btn {
    margin-top: 10px;
  }

  th,
  td {
    padding: 5px;
    text-align: start;
  }
</style>
